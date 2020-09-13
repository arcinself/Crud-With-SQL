const express = require('express');
const router = express.Router();
const {to} = require('await-to-js');
const {checkToken} = require('./../middlewares/index');
const mysql = require('./../lib/datacenter/mysql/connection');

router.get('/', async(req, res, next) => {
    let [err, result] = await to(mysql.executeQuery('SELECT * FROM courses'));

    if(result.length < 1){
        return res.json({
            err : "No course to display."
        });
    }

    return res.json({
        data : result,
        err : null
    });
});

router.get('/:id', checkToken, async(req,res)=>{
    let courseId = req.params.id;

    let [err, result] = await to(mysql.executeQuery(`SELECT * FROM courses WHERE id = ${courseId}`));

    if(result.length === 0){
        return res.json({
            err: ` No course exists with ID ${courseId}.`
        });
    }

    if (err){
        return res.json({
            err: `Error finding course with ID ${courseId}`
        })
    }

    let data = result[0];

    [err, result] = await to(mysql.executeQuery(`SELECT id, username FROM students INNER JOIN enrolledStudents ON students.id = enrolledStudents.student_id WHERE enrolledStudents.course_id = ${courseId}`));

    if (err){
        return res.json({
            err : `Error finding enrolled students in course with ID ${courseId}`
        });
    }

    data.enrolledStudents = result;

    res.json({
        data : data
    });
});

router.post('/', checkToken, async(req, res) => {
    const {name, description, availableSlots} = req.body;

    if(!name || !description || !availableSlots || availableSlots<=0){
        return res.json({
            err : "Invalid payload."
        });
    }

    let [err, result] = await to(mysql.executeQuery('SELECT * FROM courses'));

    const newId = result.length+1;

    [err, result] = await to(mysql.executeQuery(`INSERT INTO courses VALUES(${newId},"${name}","${description}",${availableSlots})`));
        if(err) {
            return res.json({
                err : "Error while adding course."
            });
        }
        return res.json({
                data : "Course successfully added."
        });
});

router.post('/:id/enroll', checkToken, async(req,res) => {
    const courseId =req.params.id;
    const studentId = req.body.id;

    if(!studentId){
        return res.json({
            err : "Invalid payload."
        });
    }

    let [err,result] = await to(mysql.executeQuery(`SELECT * FROM courses WHERE id=${courseId}`));

    if(result.length === 0){
        return res.json({
            err: ` No course exists with ID ${courseId}.`
        });
    }

    let slots = result[0].availableSlots;

    [err,result] = await to(mysql.executeQuery(`SELECT * FROM students WHERE id=${studentId}`));

    if(result.length === 0){
        return res.json({
            err: ` No student exists with ID ${studentId}.`
        });
    }

    const student = result[0];

    [err, result] = await to(mysql.executeQuery(`SELECT  * FROM enrolledStudents WHERE course_id = ${courseId} AND student_id = ${studentId}`));

    if(err){
        return res.json({
            err : "Error while enrolling the student."
        });
    }
    else if(result.length !== 0){
        return res.json({
            err :  "Student already enrolled in the course."
        });
    }
    else if(slots <= 0){
        return res.json({
            err : "No slots are available."
        });
    }
    else{
        [err, result] = await to(mysql.executeQuery(`INSERT INTO enrolledStudents VALUES( ${courseId}, ${studentId}, "${student.username}")`));
        if(!err){
            await to(mysql.executeQuery(`UPDATE courses SET availableSlots = ${slots-1} WHERE id = ${courseId}`));
            return res.json({
                data : "Student enrolled successfully to the course."
            });
        }
    }
});

router.put('/:id/deregister',checkToken, async(req,res) => {

    const courseId = req.params.id;
    const studentId = req.body.id;

    if (!studentId) {
        return res.json({
            err: "Invalid payload."
        });
    }

    let [err, result] = await to(mysql.executeQuery(`SELECT * FROM courses WHERE id=${courseId}`));

    if (result.length === 0) {
        return res.json({
            err: ` No course exists with ID ${courseId}.`
        });
    }

    [err, result] = await to(mysql.executeQuery(`SELECT * FROM students WHERE id=${studentId}`));

    if (result.length === 0) {
        return res.json({
            err: ` No student exists with ID ${studentId}.`
        });
    }

    [err, result] = await to(mysql.executeQuery(`SELECT * FROM enrolledStudents WHERE course_id = ${courseId} AND student_id = ${studentId}`));

    if (err) {
        return res.json({
            err: "Error while de-registering the student."
        });
    } else if (result.length === 0) {
        return res.json({
            err: "Student needs to be registered first."
        });
    } else {
        [err, result] = await to(mysql.executeQuery(`DELETE FROM enrolledStudents WHERE course_id = ${courseId} AND student_id = ${studentId}`));
        if (!err) {
            await to(mysql.executeQuery(`UPDATE courses SET availableSlots = availableSlots+1 WHERE id = ${courseId}`));
            return res.json({
                data: "Student de-registered successfully from the course."
            });
        }
    }
});


router.delete('/:id' ,checkToken, async(req, res) => {
    let courseId = req.params.id;

    let[err, result] = await to(mysql.executeQuery(`DELETE FROM courses WHERE id=${courseId}`));

    if (err){
        return res.json({
            err : "Error while deleting the course."
        });
    }

    if (result.affectedRows === 0){
        return res.json({
            err : `No Course with ID ${courseId}`
        });
    }

    [error, result] = await to(mysql.executeQuery(`DELETE FROM enrolledStudents WHERE course_id=${courseId}`));

    if (error) {
        return res.json({
            err : "Error."
        });
    }

    return res.json({
        data : "Course deleted successfully."
    });
});

module.exports = router;


