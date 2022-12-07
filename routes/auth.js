const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('./user/user.model');
const Token = require('./user/token.model');
const UserList = require('../admin/AddUsers/usersListModel')
const Network = require('./networks/networks.model');
const { resetPasswordMessage, sendEmail } = require('../sendMail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

function getJWT(email, _id) {
  const token = jwt.sign({
    user: {
      email: email,
      _id: _id
    }
  }, process.env.SIGNING_SECRET || '');
  return token;
}

router.post('/login', passport.authenticate('login', { session: false }), async (req, res) => {
  console.log('LOGGING IN', !(!req.user));
  try {
    let userStatus = await User.findOne({ email: req.body.email });
    if (userStatus.isBlocked) {
      return res.status(401).send({
        success: false,
        message: 'Account blocked'
      });
    }
    console.log('device token', req.body.deviceToken)
    if(!req.body.deviceToken) return res.status(400).send({ response: 'Need a device token to register device for push notifications '});
    await User.updateOne({ email: req.body.email }, {
      deviceToken: req.body.deviceToken,
      status: 'online'
    });
    let user = await User.findOne({ email: req.body.email }).select('-password -deviceToken')
      .populate('connections', 'firstName lastName email profilePicture pictures');
    return res.status(200).send({
      success: true,
      user: user,
      token: getJWT(user.email, user._id)
    });
  } catch (err) {
    console.log('error in /auth/login', err);
    return res.status(500).send({
      success: false,
      msg: err
    });
  }
});

router.post('/signup', passport.authenticate('signup', { session: false }), async (req, res) => {
  try {
    if (req.user.message == 'User exist') {
      return res.status(500).send({ message: 'User exist' });
    } else {
      const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        deviceToken: Joi.string().required(),
      });
      try {
        await schema.validateAsync({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          deviceToken: req.body.deviceToken
        });
      } catch (err) {
        console.log('invalid data', err);
        try {
          let response = await User.deleteOne( { _id: req.user._id } );
          console.log('user delete response', response)
        } catch (error) {
          console.log('error while deleting user with incomplete details');
        }
        return res.status(400).send({
          success: false,
          response: err.details
        });
      }
      let response = await User.updateOne({
        _id: req.user._id
      }, {
        $set: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          deviceTokens: req.body.deviceToken,
          isAdmin: req.body.isAdmin
        }
      });

      const listDoc = await UserList.find()

      await UserList.updateOne({_id: listDoc[0]['_id']}, {
        $push: { users: req.user._id },
      })

      await Network.updateMany({ privacy: 'global' }, {
        $push: {
          members: { memberId: req.user._id, isAdmin: false }
        }
      });
      
      console.log('got save response', response);
      let user = await User.findOne({ _id: req.user._id });
      user.password = null;
      return res.status(200).send({
        success: true,
        user: user,
        token: getJWT(req.user.email, req.user._id)
      });
    }
  } catch (err) {
    console.log('error in /auth/signup', err);
    return res.status(500).send(err);
  }
});

router.post('/social-login', async (req, res) => {
  try {
    const schema = Joi.object({
      providerId: Joi.string().required(),
      provider: Joi.string().required(),
      given_name: Joi.string().required(),
      family_name: Joi.string().required(),
      email: Joi.string().required(),
      accessToken: Joi.string().required(),
      refreshToken: Joi.string().required(),
      deviceToken: Joi.string().required()
    });
    try {
      await schema.validateAsync({
        providerId: req.body.profile.id,
        provider: req.body.profile.provider,
        accessToken: req.body.accessToken,
        refreshToken: req.body.refreshToken,
        deviceToken: req.body.deviceToken,
        given_name: req.body.profile._json.given_name,
        family_name: req.body.profile._json.family_name,
        email: req.body.profile._json.email
      });
      let user = await User.findOne({
        $and: [
          { providerId: req.body.profile.id },
          { email: req.body.profile._json.email }
        ]
      });
      if (user) {
        await User.updateOne({ _id: user._id }, {
          deviceToken: req.body.deviceToken
        });
        let updatedUser = await User.findOne({
          $and: [
            { providerId: req.body.profile.id },
            { email: req.body.profile._json.email }
          ]
        });
        return res.status(200).send({
          success: true,
          user: updatedUser,
          token: getJWT(updatedUser.email, updatedUser._id)
        });
      } else {
        let createUser = await User.create({
          firstName: req.body.profile._json.given_name,
          lastName: req.body.profile._json.family_name,
          email: req.body.profile._json.email,
          provider: req.body.profile.provider,
          providerId: req.body.profile.id,
          profilePicture: req.body.profile._json.picture,
          accessToken: req.body.accessToken,
          refreshToken: req.body.refreshToken,
          deviceTokens: req.body.deviceToken
        });
        console.log('create user', createUser)
        let user = await User.findOne({ _id: createUser._id });
        return res.status(200).send({
          success: true,
          user,
          token: getJWT(user.email, user._id)
        });
      }
    }
    catch (err) {
      console.log('data validation failed', err); {
        return res.status(500).send({
          success: false,
          response: err
        });
      }
    }
  } catch (err) {
    console.log('error in /auth/social-user', err);
    return res.status(500).send({
      success: false,
      error: err
    });
  }
});

router.post('/apple-login', async (req, res) => {

  try {

    console.log('hit /auth/apple-login');
    
    const { email, deviceToken } = req.body;
    let user = await User.find({ email: email })

    if (user.length != 0) {

      if (user.isBlocked) {
        return res.status(401).send({
          success: false,
          message: 'Account blocked'
        })
      }

      if(!deviceToken || deviceToken==='') return res.status(400).send({ response: 'Need a device token to register device for push notifications '});

      await User.updateOne({ email: email }, {
        deviceToken: deviceToken,
        status: 'online'
      });

      user = await User.findOne({ email: req.body.email }).select('-password -deviceToken')
        .populate('connections', 'firstName lastName email profilePicture pictures');

      return res.status(200).send({
        success: true,
        user: user,
        token: getJWT(user.email, user._id)
      })
      
    } else {
      
      const user = await User({
        email: email,
        deviceToken: deviceToken,
        status: 'online'
      }).save()
      
      return res.status(200).send({
        success: true,
        user: user,
        token: getJWT(user.email, user._id)
      })
    }

  } catch (error) {
    console.log('error in /auth/apple-login', error);
    return res.status(500).send({
      success: false,
      error: error
    });
  }

})

router.post('/forgot-password', async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user != null) {
      let token = await Token.findOne({ userId: user._id });
      if (token) {
        await token.deleteOne()
      };
      const resetToken = Math.floor(100000 + Math.random() * 900000);
      await new Token({
        userId: user._id,
        token: resetToken,
        createdAt: Date.now(),
      }).save();
      const mailMessage = resetPasswordMessage(resetToken)

      if(await sendEmail(req.body.email, "Forgot Password", mailMessage)){

        console.log('Email sent');
        return res.status(200).send({
          success: true,
          response: {
            msg: 'Mail sent to user email',
            userId: user._id
          }
        });

      }else{
        console.log('error in sending email');
        return res.status(503).send({
          success: false,
          msg: `Sending email to client failed due to: ${error}`
        });
      }

    } else {
      res.status(404).send({
        success: true,
        response: 'User not found'
      });
    }
  } catch (err) {
    console.log('error in /auth/forgotPassword', err);
    return res.status(500).send({
      success: false,
      error: err
    });
  }
});

router.post('/reset-password', async (req, res) => {
  console.log('/auth/reset-password called');
  try {
    let userId = req.body.userId;
    let token = req.body.token;
    let password = req.body.password;
    let user = await User.findOne({ _id: req.body.userId });
    if (user) {
      let passwordResetToken = await Token.findOne({ userId });
      if (passwordResetToken) {
        if (token === passwordResetToken.token) {
          const hash = await bcrypt.hash(password, 10);
          await User.updateOne({
            _id: userId
          }, {
            $set: {
              password: hash
            }
          });
          await passwordResetToken.deleteOne();
          return res.send({
            success: true,
            message: 'Password Changed'
          });
        }
      }
      console.log('Invalid or expired password reset token');
      return res.status(401).send({
        success: true,
        response: 'Invalid or expired password reset token'
      });
    } else {
      res.status(404).send({
        success: true,
        response: 'User does not exist'
      });
    }
  } catch (err) {
    console.log('error in /auth/reset-password', err);
    return res.status(500).send({
      success: false,
      msg: 'Error in reseting password'
    });
  }
});

module.exports = router;