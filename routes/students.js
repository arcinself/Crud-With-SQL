const express = require('express');
const router = express.Router();
const {to} = require('await-to-js');
const bcrypt  = require('bcrypt');
const validator= require('email-validator');
const jwt = require('jsonwebtoken');
const {checkToken} = require('./../middlewares/index');
const mysql = require('./../lib/datacenter/mysql/connection');

let salt = 'ZGV2c25lc3QK';

const passwordHash = async (password) => {
    const saltRounds = 12;
    const [err, passwordHash] = await to(bcrypt.hash(password, saltRounds));
    if (err) {
        return res.json({
            err : "Error while generating password hash."
        });
    }
    return passwordHash;
};

const generateToken  = (userData) => {
    let token = jwt.sign(userData, salt, {
        expiresIn: 172800000,
    });
    return token;
};

router.get('/', async(req, res) => {
    const [err,result] =await to(mysql.executeQuery(`SELECT * FROM students`));

    if(result.length<1){
        return res.json({
            err : "No student to display."
        });
    }
    return res.json({
        data : result,
        err : null
    });
});

router.get('/:id', checkToken, async (req,res) => {
    let studentId = req.params.id;

    let [err, result] = await to(mysql.executeQuery(`SELECT * FROM students WHERE id = ${studentId}`));

    if(result.length === 0){
        return res.json({
            err: ` No student exists with ID ${studentId}.`
        });
    }

    if (err){
        return res.json({
            err: `Error finding student with ID ${studentId}.`
        })
    }

    res.json({
        data : result
    });
});

router.post('/signup', async (req, res) => {
    let {username, email, password} = req.body;

    let [err,result] = await to(mysql.executeQuery(`SELECT * FROM students`));

    if(!username || !email || !password || !validator.validate(email)){
        return res.json({
            err : "Invalid payload."
        });
    }

    const newId = result.length+1;
    const encryptedPassword = await passwordHash(password);

    [err, result] = await to(mysql.executeQuery(`INSERT INTO students VALUES(${newId},"${username}","${email}","${encryptedPassword}")`));

    if(err) {
        return res.json({
            err : "Error while adding student."
        });
    }
    return res.json({
        data : "Student successfully added."
    });
});


router.post('/login', async (req, res) => {
    let {email, password} = req.body;

    if(!email || !password){
        return res.json({
            err : "Invalid payload."
        });
    }

    let [err,result] = await to(mysql.executeQuery(`SELECT * FROM students WHERE email="${email}"`));

    if(result.length === 0){
        return res.json({
            err: "Student email not found."
        });
    }

    [err, isValid] = await to(bcrypt.compare(password, result[0].password));

    if(isValid){
        const student = {
            id : result[0].id,
            username : result[0].username,
            email : email
        }
        return res.json({
            data : "Successfully logged in.",
            token: generateToken(student),
            err: null
        });
    }else{
        return res.json({
            err: "Invalid Password."
        });
    }
});

router.delete('/:id' , checkToken, async(req, res) => {
    let studentId = req.params.id;

    let[err, result] = await to(mysql.executeQuery(`DELETE FROM students WHERE id=${studentId}`));

    if (err){
        return res.json({
            err : "Error while deleting the student."
        });
    }

    if (result.affectedRows === 0){
        return res.json({
            err : `No Student with ID ${studentId}`
        });
    }

    [error, result] = await to(mysql.executeQuery(`DELETE FROM enrolledStudents WHERE student_id=${studentId}`));

    if (error) {
        return res.json({
            err : "Error."
        });
    }

    return res.json({
        data : "Student deleted successfully."
    });
});

module.exports = router;


