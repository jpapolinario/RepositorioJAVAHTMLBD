import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class Servidor {

    public static void main(String[] args) throws IOException {
        int porta = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(porta), 0);

        // Mapeia o endpoint /usuarios
        server.createContext("/usuarios", new UsuarioHandler());
        server.setExecutor(null);

        System.out.println("Servidor HTTP rodando com sucesso em http://localhost:" + porta + "/usuarios");
        server.start();
    }

    static class UsuarioHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            adicionarCabecalhosCors(exchange);

            String metodo = exchange.getRequestMethod().toUpperCase();
            String path = exchange.getRequestURI().getPath(); // Ex: /usuarios ou /usuarios/5

            try {
                if (metodo.equals("OPTIONS")) {
                    exchange.sendResponseHeaders(204, -1);
                    return;
                }

                if (metodo.equals("GET")) {
                    listarUsuarios(exchange);
                } else if (metodo.equals("POST")) {
                    cadastrarUsuario(exchange);
                } else if (metodo.equals("PUT")) {
                    int id = extrairIdDaUrl(path);
                    atualizarUsuario(exchange, id);
                } else if (metodo.equals("DELETE")) {
                    int id = extrairIdDaUrl(path);
                    excluirUsuario(exchange, id);
                } else {
                    enviarResposta(exchange, 405, "{\"erro\":\"Metodo nao permitido\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                enviarResposta(exchange, 500, "{\"erro\":\"" + e.getMessage() + "\"}");
            }
        }

        private void listarUsuarios(HttpExchange exchange) throws IOException, SQLException {
            List<String> listaJson = new ArrayList<>();
            String sql = "SELECT id, nome, data_nascimento, idade, cpf, sexo, estado_civil, conjuge, endereco, cep, cidade, estado, complemento, email FROM usuarios";

            try (Connection conn = ConexaoBanco.obterConexao();
                    PreparedStatement stmt = conn.prepareStatement(sql);
                    ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    String userJson = String.format(
                            "{\"id\":%d,\"nome\":\"%s\",\"dataNascimento\":\"%s\",\"idade\":%d,\"cpf\":\"%s\",\"sexo\":\"%s\",\"estadoCivil\":\"%s\",\"conjuge\":\"%s\",\"endereco\":\"%s\",\"cep\":\"%s\",\"cidade\":\"%s\",\"estado\":\"%s\",\"complemento\":\"%s\",\"email\":\"%s\"}",
                            rs.getInt("id"),
                            escapar(rs.getString("nome")),
                            escapar(rs.getString("data_nascimento")),
                            rs.getInt("idade"),
                            escapar(rs.getString("cpf")),
                            escapar(rs.getString("sexo")),
                            escapar(rs.getString("estado_civil")),
                            escapar(rs.getString("conjuge")),
                            escapar(rs.getString("endereco")),
                            escapar(rs.getString("cep")),
                            escapar(rs.getString("cidade")),
                            escapar(rs.getString("estado")),
                            escapar(rs.getString("complemento")),
                            escapar(rs.getString("email")));
                    listaJson.add(userJson);
                }
            }

            String respostaFinal = "[" + String.join(",", listaJson) + "]";
            enviarResposta(exchange, 200, respostaFinal);
        }

        private void cadastrarUsuario(HttpExchange exchange) throws IOException, SQLException {
            String corpoRequisicao = lerCorpo(exchange);

            String sql = "INSERT INTO usuarios (nome, data_nascimento, idade, cpf, sexo, estado_civil, conjuge, endereco, cep, cidade, estado, complemento, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (Connection conn = ConexaoBanco.obterConexao();
                    PreparedStatement stmt = conn.prepareStatement(sql)) {

                preencherStatement(stmt, corpoRequisicao);
                stmt.executeUpdate();
            }

            enviarResposta(exchange, 201, "{\"mensagem\":\"Usuario cadastrado com sucesso!\"}");
        }

        private void atualizarUsuario(HttpExchange exchange, int id) throws IOException, SQLException {
            if (id <= 0) {
                enviarResposta(exchange, 400, "{\"erro\":\"ID invalido na URL\"}");
                return;
            }

            String corpoRequisicao = lerCorpo(exchange);

            String sql = "UPDATE usuarios SET nome=?, data_nascimento=?, idade=?, cpf=?, sexo=?, estado_civil=?, conjuge=?, endereco=?, cep=?, cidade=?, estado=?, complemento=?, email=? WHERE id=?";

            try (Connection conn = ConexaoBanco.obterConexao();
                    PreparedStatement stmt = conn.prepareStatement(sql)) {

                preencherStatement(stmt, corpoRequisicao);
                stmt.setInt(14, id);

                int linhasAfetadas = stmt.executeUpdate();
                if (linhasAfetadas > 0) {
                    enviarResposta(exchange, 200, "{\"mensagem\":\"Usuario atualizado com sucesso!\"}");
                } else {
                    enviarResposta(exchange, 404, "{\"erro\":\"Usuario nao encontrado\"}");
                }
            }
        }

        private void excluirUsuario(HttpExchange exchange, int id) throws IOException, SQLException {
            if (id <= 0) {
                enviarResposta(exchange, 400, "{\"erro\":\"ID invalido na URL\"}");
                return;
            }

            String sql = "DELETE FROM usuarios WHERE id = ?";

            try (Connection conn = ConexaoBanco.obterConexao();
                    PreparedStatement stmt = conn.prepareStatement(sql)) {

                stmt.setInt(1, id);
                int linhasAfetadas = stmt.executeUpdate();

                if (linhasAfetadas > 0) {
                    enviarResposta(exchange, 200, "{\"mensagem\":\"Usuario excluido com sucesso!\"}");
                } else {
                    enviarResposta(exchange, 404, "{\"erro\":\"Usuario nao encontrado\"}");
                }
            }
        }

        // Metodos auxiliares
        private void preencherStatement(PreparedStatement stmt, String json) throws SQLException {
            stmt.setString(1, extrairCampo(json, "nome"));
            stmt.setString(2, extrairCampo(json, "dataNascimento"));

            String idadeStr = extrairCampo(json, "idade");
            stmt.setInt(3, idadeStr.isEmpty() ? 0 : Integer.parseInt(idadeStr));

            stmt.setString(4, extrairCampo(json, "cpf"));
            stmt.setString(5, extrairCampo(json, "sexo"));
            stmt.setString(6, extrairCampo(json, "estadoCivil"));
            stmt.setString(7, extrairCampo(json, "conjuge"));
            stmt.setString(8, extrairCampo(json, "endereco"));
            stmt.setString(9, extrairCampo(json, "cep"));
            stmt.setString(10, extrairCampo(json, "cidade"));
            stmt.setString(11, extrairCampo(json, "estado"));
            stmt.setString(12, extrairCampo(json, "complemento"));
            stmt.setString(13, extrairCampo(json, "email"));
        }

        private String extrairCampo(String json, String chave) {
            String busca = "\"" + chave + "\"";
            int index = json.indexOf(busca);
            if (index == -1)
                return "";

            int inicioValor = json.indexOf(":", index) + 1;
            while (inicioValor < json.length()
                    && (json.charAt(inicioValor) == ' ' || json.charAt(inicioValor) == '"')) {
                inicioValor++;
            }

            int fimValor = inicioValor;
            boolean dentroDeAspas = json.charAt(inicioValor - 1) == '"';

            while (fimValor < json.length()) {
                char c = json.charAt(fimValor);
                if (dentroDeAspas && c == '"')
                    break;
                if (!dentroDeAspas && (c == ',' || c == '}'))
                    break;
                fimValor++;
            }

            return json.substring(inicioValor, fimValor).trim();
        }

        private int extrairIdDaUrl(String path) {
            String[] partes = path.split("/");
            if (partes.length > 2) {
                try {
                    return Integer.parseInt(partes[2]);
                } catch (NumberFormatException ignored) {
                }
            }
            return -1;
        }

        private String lerCorpo(HttpExchange exchange) throws IOException {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String linha;
                while ((linha = reader.readLine()) != null) {
                    sb.append(linha);
                }
                return sb.toString();
            }
        }

        private void enviarResposta(HttpExchange exchange, int status, String resposta) throws IOException {
            byte[] bytes = resposta.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(status, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private void adicionarCabecalhosCors(HttpExchange exchange) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }

        private String escapar(String valor) {
            if (valor == null)
                return "";
            return valor.replace("\"", "\\\"");
        }
    }
}