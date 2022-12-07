var express = require('express');
var router = express.Router();
const Admin = require('./model/accountSchema')
const bcrypt = require('bcrypt');
const {generatePass} = require('../../util')
const aws = require('aws-sdk');

const config = {
    region: 'eu-west-2',
    accessKeyId: 'AKIA4UJ2BONSUUVINZF6',
    secretAccessKey: '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',
    signatureVersion: 'v4',
  }

router.post('/', async function(req, res, next) {

    try {

        console.log('POST admin/account/ CALLED')

        const {adminId} = req.body

        const admin = await Admin.findById(adminId)

        if(admin){

            const newObject = {
                id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                profilePicture: admin.profilePicture
            }

            return res.status(200).send({
                success: true,
                message: 'success',
                data: newObject
            })

        }else{
            return res.status(500).send({
                success: false,
                message: 'Invalid ID',
                data: []
            })
        }
        
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
})

router.post('/sign_up', async function(req, res, next) {
    try {

        const {username, email, password, firstname, lastname, role} = req.body

        var salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(password, salt);

        const newObject = {
            username: username,
            email: email,
            password: hashPass,
            firstName: firstname,
            lastName: lastname,
            role: role
        }

        await Admin(newObject).save()

        return res.status(200).send({
            code: 200,
            success: true,
            data: []
        })
        
        
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
});


router.post('/login', async function(req, res) {
    try {

        console.log('POST admin/account/login Called')

        const {email, password} = req.body

        const admin = await Admin.find({email: email})

        if(admin.length !== 0){

            if(await bcrypt.compare(password, admin[0]['password'])){

                const newObject = {
                    id: admin[0]['_id'],
                    username: admin[0]['username'],
                    email: admin[0]['email'],
                    firstName: admin[0]['firstName'],
                    lastName: admin[0]['lastName'],
                    role: admin[0]['role'],
                    profilePicture: admin[0]['profilePicture']
                }
        
                return res.status(200).send({
                    code: 200,
                    success: true,
                    message: 'Login Successfully',
                    data: newObject
                })
    
            }else{
                return res.status(500).send({
                    code: 500,
                    success: false,
                    message: 'Invalid Cridentials',
                    data: {}
                })
            }
        }else{

            return res.status(500).send({
                code: 500,
                success: false,
                message: 'Invalid Cridentials',
                data: {}
            })
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
});


router.post('/generate_account', async function(req, res) {

    try {

        const {profilePicture} = req.body
        
        const PASS = generatePass()
        const CODE = Math.floor(100 + Math.random() * 900)

        var salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(PASS, salt);

        const newObject = {
            username: 'Admin',
            email: `secondary${CODE}@making_media.io`,
            password: hashPass,
            orignalPass: PASS,
            firstName: 'Making',
            lastName: 'Media',
            role: 'Staff',
            profilePicture: profilePicture
        }

        await Admin(newObject).save()

        return res.status(200).send({
            code: 200,
            success: true,
            data: newObject
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
})

router.get('/get_staff', async function(req, res) {

    try {

        const staff = await Admin.find({role: 'Staff'})

        return res.status(200).send({
            code: 200,
            success: true,
            data: staff
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
})

router.post('/delete_staff', async function(req, res) {

    try {
        const {staffId} = req.body

        const s3 = new aws.S3(config)

        const admin = await Admin.findById(staffId)

        let filename = admin.profilePicture.split('/').pop()

        await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()

        await Admin.deleteOne({_id: staffId})

        const staff = await Admin.find({role: 'Staff'})

        return res.status(200).send({
            code: 200,
            success: true,
            message: 'Deleted Successfully',
            data: staff
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
})

router.post('/update_info', async function(req, res) {

    try {

        const {adminId, username, email, firstName, lastName, password, profilePicture} = req.body

        if(password === ''){

            if(profilePicture === ''){

                await Admin.updateOne({_id: adminId}, {
                    username: username,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                })

            }else{

                await Admin.updateOne({_id: adminId}, {
                    username: username,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    profilePicture: profilePicture
                })
            }

            res.status(200).send({
                success: true,
                message: 'Updated Successfully',
                data: []
            })
        }else{

            var salt = bcrypt.genSaltSync(10);
            const hashPass = bcrypt.hashSync(password, salt);

            if(profilePicture === ''){

                await Admin.updateOne({_id: adminId}, {
                    username: username,
                    email: email,
                    password: hashPass,
                    firstName: firstName,
                    lastName: lastName,
                })

            }else{

                await Admin.updateOne({_id: adminId}, {
                    username: username,
                    email: email,
                    password: hashPass,
                    firstName: firstName,
                    lastName: lastName,
                    profilePicture: profilePicture
                })
            }
    
            res.status(200).send({
                success: true,
                message: 'Updated Successfully',
                data: []
            })
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
})



module.exports = router;
