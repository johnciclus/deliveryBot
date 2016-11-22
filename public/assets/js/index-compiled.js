'use strict';/* Card.js plugin by Jesse Pollak. https://github.com/jessepollak/card */var params=location.search.substring(1).split('=');$('<input>').attr({type:'hidden',name:'consumerID',value:params[1]}).appendTo('form');$('form').card({container:'.card-wrapper',width:200,formSelectors:{nameInput:'input[name="holderName"]'}});

//# sourceMappingURL=index-compiled.js.map