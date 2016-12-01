import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

function createLocalStore(reducer){
    global.store = createStore(reducer, applyMiddleware(thunk));
    store.subscribe(() =>
        console.log('\n')
    );
}

function getData(recipientId, property){
    if(typeof recipientId !== 'undefined' && typeof store !== 'undefined' && typeof store.getState() !== 'undefined'){
        let state = store.getState();
        let data = state.userData;
        let userData = data[recipientId];

        if(typeof userData == 'undefined'){
            data[recipientId] = {};
            userData = data[recipientId];
        }

        if(typeof property == 'undefined')
            return userData;
        else{
            if(userData.hasOwnProperty(property)){
                return userData[property];
            }
            else
                return undefined;
        }
    }
    else return undefined;
}


module.exports = {createLocalStore, getData}