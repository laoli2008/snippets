<?php

const MYSQL_HOST = 'localhost';
const MYSQL_DBNAME = 'playground';
const MYSQL_CHARSET = 'utf8';
const MYSQL_USERNAME = 'root';
const MYSQL_PASSWORD = '';

class Database
{
    protected $pdo = null;
    protected $stmt = null;

    public function find($sql, $params = array())
    {
        if ($this->execute($sql, $params)) {
            $this->stmt->setFetchMode(PDO::FETCH_ASSOC);
            $data = $this->stmt->fetch();
            return $data;
        }

        return false;
    }

    public function findAll($sql, $params = array())
    {
        if ($this->execute($sql, $params)) {
            $this->stmt->setFetchMode(PDO::FETCH_ASSOC);
            $data = $this->stmt->fetchAll();
            return $data;
        }

        return array();
    }

    public function update($sql, $params = array())
    {
        $ret = $this->execute($sql, $params);

        if ($ret === false) {
            return -1;
        } else if ($ret) {
            return $this->stmt->rowCount();
        }
        return 0;
    }

    public function insert($sql, $params = array())
    {
        if ($this->execute($sql, $params)) {
            return $this->stmt->lastInsertId();
        }
        return false;
    }

    public function delete($sql, $params = array())
    {
        $ret = $this->execute($sql, $params);

        if ($ret === false) {
            return -1;
        } else if ($ret) {
            return $this->stmt->rowCount();
        }
        return 0;
    }

    public function query($sql, $params = array())
    {
        return $this->execute($sql, $params);
    }

    public function lastInsertId()
    {
        return $this->pdo->lastInsertId();
    }

    public function rowCount()
    {
        return $this->stmt->rowCount();
    }

    public function quote($value)
    {
        return $this->pdo->quote($value);
    }

    protected function execute($sql, $params)
    {
        if (is_null($this->pdo)) {
            $this->connect();
        }

        $this->stmt = $this->pdo->prepare($sql);

        // print_r($this->pdo->errorInfo());
        // print_r($this->stmt->errorInfo());

        return $this->stmt->execute($params);
    }

    protected function connect()
    {
        try {
            $this->pdo = new PDO(
                'mysql:host='.MYSQL_HOST.
               #';port='.MYSQL_PORT.
                ';dbname='.MYSQL_DBNAME.
                ';charset='.MYSQL_CHARSET,
                MYSQL_USERNAME, MYSQL_PASSWORD);
        } catch (PDOException $ex) {
        }
    }
}

$db = new Database();

$db->update("UPDATE test_schema SET alexa_rank=? WHERE id=?", array(11, 1));
$data = $db->find("SELECT * FROM test_schema");
print_r($data);
#---------
$db->query("UPDATE test_schema SET alexa_rank=? WHERE id=?", array(22, 1));
$data = $db->find("SELECT * FROM test_schema");
print_r($data);
