import Parse from '../../lib/parse'
import User from '../../lib/models/User'

describe("User creation", function () {
    it("create user", function () {
        let user = new User();
        expect(user.className).toBe('_User');
    });
});

describe("User static methods", function () {
    let userData;
    beforeEach(function (done) {
        User.getFacebookUserData("1100195690052041", "EAACmGsSpx0UBACjteceMUf4kclVZCyPtvFeumLg4MGmnFImX6e6YNV2Brwzuo3YDCzm8SdKP3AY9mRMe8t91ocZAqkCKSOVR492v0zxWMzGz8SUfzGj0O7XqOyyy9XEzWUabYj3GZAaZBHcZBuZBCAySVeEfbhc5LSDUA4ZCZBl7ywZDZD").then(data => {
            userData = data;
            done()
        })
    });

    it("get facebook information", function () {
        expect(userData).toEqual({
            first_name: 'John',
            last_name: 'Garavito Suárez',
            locale: 'en_US',
            timezone: -5,
            gender: 'male' });
    });
});