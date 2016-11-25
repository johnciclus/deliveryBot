import Parse from '../../lib/parse'
import User from '../../lib/models/User'
import objectAssign from 'object-assign';
import {createLocalStore, getData} from '../../lib/localStore'
import { extractParseAttributes } from '../../lib/parseUtils';


describe("LocalStore creation", function () {
    it("create localStore", function () {
        const initialState = {
            userData: { }
        }

        const reducer = (state = initialState, action) => {
            let data = action.data;
            return {...state};
        }

        createLocalStore(reducer);
    });

    it("get userData", function () {
        expect(getData('1100195690052041')).toEqual({})
    })

    it("deberia retornar indefinido cuando el usuario no existe", function () {
        expect(getData('1100195690052041', 'user')).toBe(undefined)
    })

    it("test getData user and property", function () {
        let recipientId = '1100195690052041'
        let userData = {
            first_name: 'John',
            last_name: 'Garavito Suárez',
            locale: 'en_US',
            timezone: -5,
            gender: 'male'
        };

        let userTmp = new User(objectAssign(userData, {facebookId: recipientId}));
        let state = store.getState();
        objectAssign(state.userData[recipientId], {user: extractParseAttributes(userTmp)});

        expect(getData('1100195690052041', 'user')).toEqual({
            id: undefined,
            first_name: 'John',
            last_name: 'Garavito Suárez',
            locale: 'en_US',
            timezone: -5,
            gender: 'male',
            facebookId: '1100195690052041',
            rawParseObject: userTmp })
    })

    it("test getData user with all properties", function () {
        let userData = getData('1100195690052041');
        expect(userData.hasOwnProperty('user')).toEqual(true);

        let user = userData.user;
        expect(user.first_name).toBe('John');
        expect(user.last_name).toBe('Garavito Suárez');
        expect(user.locale).toBe('en_US');
        expect(user.timezone).toBe(-5);
        expect(user.facebookId).toBe('1100195690052041');
    })
});
