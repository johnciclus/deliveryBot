
const User = Parse.Object.extend('User', {
    initialize: function (attrs, options) {
        //console.log('new user');
        //console.log();
        //console.log(options);
    },
    registered: function (callback) {
        new Parse.Query('User').equalTo('facebookId', this.get('recipientId')).first()
            .then(user => {
                    if (callback) {
                        callback(user);
                    }
                },
                (error) => {
                    console.log('Error');
                    console.log(error);
                })
    }
});

export default User