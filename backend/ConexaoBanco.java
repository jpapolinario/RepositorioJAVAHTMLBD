import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConexaoBanco {

    // loginTimeout=5 evita que ele fique travado esperando se a porta estiver
    // fechada
    private static final String URL = "jdbc:sqlserver://localhost:1433;databaseName=EstagioDB;encrypt=false;trustServerCertificate=true;loginTimeout=5;";
    private static final String USUARIO = "sa";
    private static final String SENHA = "#Jplindao159";

    public static Connection obterConexao() throws SQLException {
        try {
            // Força o carregamento da classe do driver na memória
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Driver JDBC não localizado no Classpath!");
        }
        return DriverManager.getConnection(URL, USUARIO, SENHA);
    }

    public static void main(String[] args) {
        System.out.println("Tentando conectar ao SQL Server...");
        try (Connection conn = obterConexao()) {
            if (conn != null) {
                System.out.println("SUCESSO: Conectado ao SQL Server!");
            }
        } catch (SQLException e) {
            System.err.println("ERRO ao conectar:");
            e.printStackTrace();
        }
    }
}