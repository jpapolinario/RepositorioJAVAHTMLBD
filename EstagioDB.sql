CREATE DATABASE EstagioDB;
GO

USE EstagioDB;
GO

CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(256) NOT NULL,
    data_nascimento VARCHAR(10) NOT NULL,
    idade INT,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    sexo VARCHAR(20),
    estado_civil VARCHAR(50),
    conjuge VARCHAR(256),
    endereco VARCHAR(256),
    cep VARCHAR(9),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    complemento VARCHAR(256),
    email VARCHAR(256)
);
GO