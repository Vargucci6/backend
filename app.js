const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3050;

const app = express();

app.use(cors()); // Permite conexiones de otros origenes
app.use(bodyParser.json());

// MySql

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "newinntech",
});

// Rutas

app.get("/", (req, res) => {
  res.send("Bienvenido a la API");
});

// Registrar

app.post("/add", (req, res) => {
  const sql = "INSERT INTO user SET ?";
  const customerObj = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };
  try {
    if (
      customerObj.name == "" ||
      customerObj.email == "" ||
      customerObj.password == ""
    ) {
      res.send();
    } else {
      if (
        /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i.test(
          customerObj.email
        ) &&
        customerObj.password.length >= 8
      ) {
        connection.query(sql, customerObj, (error) => {
          if (error) {
            res.send(false);
          } else {
            res.status(200);
            res.send(true);
          }
        });
      } else {
        res.send();
      }
    }
  } catch (error) {
    res.send(error);
  }
});

// Listar usuarios

app.get("/customers", (req, res) => {
  const sql = "SELECT * FROM user";
  connection.query(sql, (error, results) => {
    if (error) throw error;
    if (results.length > 0) {
      res.json(results);
    } else {
      res.send(false);
    }
  });
});

// Ver usuario

app.get("/customers/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM user WHERE id_user = ${id}`;
  connection.query(sql, (error, results) => {
    if (error) throw error;
    if (results.length > 0) {
      res.json(results);
    } else {
      res.send("No hay resultados");
    }
  });
});

//Iniciar sesión método

app.post("/login", (req, res) => {
  const customerObj = {
    email: req.body.email,
    password: req.body.password,
  };
  if (customerObj.email == "" || customerObj.password == "") {
    res.send(false)
  } else {
    const sql = `SELECT * FROM user WHERE email = '${customerObj.email}' AND password = '${customerObj.password}'`;
    connection.query(sql, (error, results) => {
      if (error) throw error;
      if (results.length > 0) {
        jwt.sign(
          { user: results },
          "secretKey",
          { expiresIn: "1d" },
          function (err, token) {
            if (err) {
              res.send(false)
            } else {
              res.json (token);
            }
          }
        );
      } else {
        res.send(false);
      }
    });
  }
});

//Autorización del token

app.post("/post", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretKey", (error, authData) => {
    if (error) {
      res.send(false);
    } else {
      res.send(true);
    }
  });
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

//Borrar usuario

app.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM user WHERE id_user = '${id}'`;
  connection.query(
    `SELECT * FROM user WHERE id_user = ${id}`,
    (error, results) => {
      if (error) throw error;
      if (results.length > 0) {
        connection.query(sql, (error) => {
          if (error) throw error;
          res.send("Usuario eliminado correctamente");
        });
      } else {
        res.send("No se encontró usuario");
      }
    }
  );
});

//Actualizar usuario

app.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const sql = `UPDATE user SET name = '${name}', email = '${email}', password = '${password}' WHERE id_user = '${id}'`;
  connection.query(
    `SELECT * FROM user WHERE id_user = ${id}`,
    (error, results) => {
      if (error) throw error;
      if (results.length > 0) {
        connection.query(sql, (error) => {
          if (error) throw error;
          res.send("Usuario actualizado correctamente");
        });
      } else {
        res.send("No se encontró usuario");
      }
    }
  );
});

// Verificar conexión

connection.connect((error) => {
  if (error) throw error;
  console.log("Servidor de base de datos está corriendo!");
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
