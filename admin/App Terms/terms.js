var express = require('express');
var router = express.Router();
var Term = require('./model/termSchema')


router.post('/get_term', async function(req, res, next) {
    try {

        console.log('POST admin/term/get_term/ CALLED')

        const {type} = req.body

        const term = await Term.find({type: type})

        if(term){

            return res.status(200).send({
                success: true,
                message: 'success',
                data: term[0]
            })

        }else{

            return res.status(500).send({
                success: false,
                message: 'Invaild Parameters',
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

router.post('/add_term', async function(req, res, next) {

    try {

        console.log('POST admin/term/add_term/ CALLED')

        const {type, content} = req.body

        const newObject = {
            type: type,
            content: content,
            createdAt: new Date()
        }

        await Term(newObject).save()

        return res.status(200).send({
            success: true,
            message: 'Added Successfully',
            data: newObject
        })
        
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: 'Server Error',
            data: []
        })
    }
})

router.post('/update_term', async function(req, res, next) {
    try {

        console.log('POST admin/term/update_term/ CALLED')

        const {type, content} = req.body

        await Term.updateOne({type: type}, {$set: {content: content}})

        const term = await Term.find({type: type})

        if(term){

            return res.status(200).send({
                success: true,
                message: 'success',
                data: term[0]
            })

        }else{
            
            return res.status(500).send({
                success: false,
                message: 'Invaild Parameters',
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

module.exports = router;