"use strict";

var models = require('../models');

module.exports = {

    /*
        function called after a successful login via spark oauth.
        Check if the tenant and the user already exists, and create them if not
     */
    userLoggedIn: function(id, displayName, emails, orgId){
        return new Promise((resolve, reject) => {
            models.tenant.findOrCreate({
                where: {
                    orgId: orgId
                },
                defaults: {
                    name: 'auto'
                }
            }).then(tenant => {
                //check the user
                var email = null;
                if(emails && emails.length > 0){
                    email = emails[0];
                }
                models.user.findOrCreate({
                    where: {
                        sparkId: id
                    },
                    defaults: {
                        tenantId: tenant.id,
                        name: displayName,
                        email: email
                    }
                }).then(user => {
                    resolve(user);
                }, err => {
                    reject(err)
                });
            }, err => {
                reject(err);
            });
        });
    },

    getGoogleDriveCredentials: function(userId, storeId){
        return new Promise((resolve, reject) => {
            models.sequelize.query('select * from ﻿document_stores');
        });
    }

}