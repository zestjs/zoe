/*
 * ZOE
 * Zest Object Extension
 * http://github.com/zestjs/zoe
 *
 * A natural JavaScript extension-based inheritance model.
 *
 * Can be used on its own, but primarily created for use
 * as part of the zestjs web framework.
 * (http://github.com/zestjs/zest)
 *
 * This code is fully commented, with the readme from
 * http://github.com/zestjs/zoe
 *
 *
 * Environment
 * -----------
 *
 * This module works in NodeJS, AMD and the browser.
 *
 * In the case of AMD and the browser, a global 'zoe' is created.
 * If a 'zoe' global already exists, it is extended with these methods.
 *
 *
 * Public Methods and Properties
 * -----------------------------
 *
 * The module defines the following methods.
 * Further documentation on their usage is provided with the code.
 * Note, for code minification, 'zoe_extend' is used instead of zoe.extend, and 'zoe_fn' is used instead of zoe.fn. These are public interfaces.
 *
 * Primary methods:
 * 1) zoe.fn
 * 2) zoe.extend
 * 3) zoe.create
 *
 * Utility functions
 * -zoe.log
 * -zoe.dir
 *
 * 1) zoe.fn
 *  execution functions:
 *  -zoe.fn.STOP_DEFINED
 *  -zoe.fn.LAST_DEFINED
 *  -zoe.fn.ASYNC
 *
 *  helper functions:
 *  -zoe.fn.executeReduce
 *  -zoe.on
 *  -zoe.off
 *
 * 2) zoe.extend
 *  extension functions:
 *  -zoe.extend.DEFINE
 *  -zoe.extend.REPLACE
 *  -zoe.extend.FILL
 *  -zoe.extend.DREPLACE
 *  -zoe.extend.DFILL
 *  -zoe.extend.IGNORE
 *  -zoe.extend.STR_APPEND
 *  -zoe.extend.STR_PREPEND
 *  -zoe.extend.ARR_APPEND
 *  -zoe.extend.ARR_PREPEND
 *  -zoe.extend.APPEND
 *  -zoe.extend.PREPEND
 *
 *  function chain extension utility function:
 *  -zoe.extend.makeChain
 *
 *  function chain extension functions:
 *  -zoe.extend.CHAIN
 *  -zoe.extend.CHAIN_FIRST
 *  -zoe.extend.CHAIN_STOP_DEFINED
 *
 * 3) zoe.create
 *  helper function:
 *  -zoe.inherits
 *
 *  core inheritor:
 *  -zoe.Constructor
 * 
 */
(function (root, factory) {
  //nodejs
  if (typeof exports === 'object')
    module.exports = factory();
  //amd + zoe global
  else if (typeof define === 'function' && define.amd)
    define(function() {
      return factory();
    });
  //browser zoe global
  else
    root.zoe = factory();
}(this, function() {
  
var zoe = {};

/*
 * zoe.log, zoe.dir
 * Console log function existence wrappers
 * 
 */
zoe.log = zoe.dir = function(){};
if (typeof console !== 'undefined') {
  if (console.log)
    zoe.log = function(str, type) { console.log(str); }
  if (console.dir)
    zoe.dir = function(obj, type) { console.dir(obj); }
}


/*
 * zoe.fn
 * Flexible function composition
 * http://github.com/zestjs/zoe#zfn
 *
 *
 * The basic concept is that there are many situations when designing software that
 * involve the execution of arrays of functions.
 * zoe.fn provides a flexible way of managing the execution of arrays of functions
 * or 'function chains'.
 *
 * For example,
 * 1) Event handling is basically adding a function to a list of functions
 *    to be executed together when an event triggers.
 * 2) Asynchronous tasks involve running a list of functions, but only
 *    starting the next one once the previous one has sent a complete callback.
 * 3) Logic filters involve function composition where outputs are logically
 *    combined.
 *
 * All of the above cases can be handled by the use of zoe.fn.
 *
 * zoe.fn is a factory function that returns a fresh function instance, which wraps
 *   an array of functions.
 * It takes an optional specified execution rule and list of initial functions.
 * Additional functions can be added to the wrapper on at any time by using the f.on() syntax.
 * 
 *
 * Usage:
 *   zoe.fn(executionFunction, [initialFunctions]);
 *   zoe.fn(executionFunction);
 *   zoe.fn([initialFunctions]);
 * 
 * [initialFunctions]: an array of the inital functions to be provided (optional)
 * executionFunction: the main execution function to handle function execution and output (optional)
 *    when no executionFunction is provided, defaults to zoe.fn.LAST_DEFINED
 *
 * output: a function instance of a zoe.fn 'function chain', with the following public properties:
 *   on: function(f), used to add new functions to the list of functions
 *   off: function(f), used to remove functions from the list of functions
 *   first: function(f), used to add a new function at the beginning of the list of functions
 *   bind: function(self), used to permanently bind this instance to the given 'this' reference
 *         when passed the value `undefined`, binding will revert to natural function binding
 *   
 *
 * Example
 * -------
 *
 *  var clickEvent = zoe.fn();
 *  
 *  clickEvent.on(function(type) {
 *    console.log('click event fired: ' + type);
 *  });
 *  clickEvent.on(function() {
 *    console.log('another hook');
 *  });
 *  clickEvent.first(function() {
 *    console.log('this hook runs first');
 *  });
 *
 *  clickEvent('left click');
 *  //outputs:
 *  // 'this hook runs first'
 *  // 'click event fired: left click'
 *  // 'another hook'
 *
 * Thus in this eventing model, the function itself is the event handler, and running the function
 * is the act of triggering the event.
 * This is the event model used by the ZestJS component framework.
 *
 * Execution Functions
 * -------------------
 *
 * The execution function takes the following form:
 *
 *   executionFunction = function(self, args, fns) {
 *     return output;
 *   }
 *
 *   self: the 'this' scope to use
 *   args: the array of arguments (already converted to an array)
 *   fns: the array of functions to execute
 *
 * It is the responsibilty of the execution function to determine which functions to run,
 * when to run them, with what arguments and scope, and what final output to provide.
 *
 *
 * Reduce Pattern Helper:
 *
 * The most common execution is to simply run all the functions, with the arguments and
 * scope as provided, and then provide an output.
 * In this case, each function has a separate output, and we need to decide how to combine
 * those outputs into a single output.
 *
 * In this case, there is an execution helper that will generate an execution function based
 * on the above rules, and a provided 'reduction function', as expected by the standard
 * pattern for a reduce function.
 *
 * This helper is defined as:
 *
 *    zoe.fn.executeReduce(initialValue, function(output1, output2) {
 *      return combinedOutput;
 *    });
 *
 * The initialValue is optional, otherwise undefined is used.
 *
 * The reduce function provided into the executeReduce function will be applied
 * to all pairs of output from the initial value and first value, up to the second last
 * reduction output and final function output.
 *
 * Example
 * -------
 *
 * The default composition function used by zoe.fn() is zoe.fn.LAST_DEFINED.
 * This function returns the output from the last function in the list to return a non-undefined output.
 *
 * It is written as:
 *
 * zoe.fn.LAST_DEFINED = zoe.fn.executeReduce(function(output1, output2) {
 *   return output2 !== undefined ? output2 : output1;
 * });
 *
 * It works as the reduction is applied in order along the list of outputs.
 *
 *
 * The full list of provided composition functions is covered below.
 *
 * zoe.fn.LAST_DEFINED
 * zoe.fn.STOP_DEFINED
 * zoe.fn.ASYNC
 *
 * Documentation on these is given below.
 * 
 */

var zoe_fn = zoe.fn = function(run, fns) {
  if (run instanceof Array) {
    fns = run;
    run = null;
  }
  
  var instance = function() {
    //http://github.com/zestjs/zoe#zfn
    return instance.run(instance._this || this, Array.prototype.splice.call(arguments, 0), instance.fns);
  }
  
  instance.constructor = zoe_fn;
  
  instance.fns = fns || [];
  instance.run = (typeof run == 'string' ? zoe_fn[run] : run) || zoe_fn.LAST_DEFINED;
  
  instance.on = on;
  instance.off = off;
  instance.first = first;
  
  instance._this = undefined;
  instance.bind = bind;
  
  return instance;
}

var bind = function(_this) {
  this._this = _this;
  return this;
}
var on = function(fn) {
  this.fns.push(fn);
  return this;
}
var off = function(fn) {
  if (!fn) {
    this.fns = [];
    return;
  }
  for (var i = 0; i < this.fns.length; i++)
    if (this.fns[i] == fn) {
      this.fns.splice(i, 1);
      return;
    }
}
var first = function(fn) {
  this.fns = [fn].concat(this.fns);
  return this;
}

/* zoe.fn.executeReduce
 * 
 * A helper function in building synchronous composition functions
 * takes a "reduce" function to amalgamating synchronous outputs into a
 * single output
 *
 * Usage:
 *   zoe.fn.executeReduce(startVal, function(out1, out2) {
 *     return reducedOutput;
 *   });
 *
 * Example:
 *
 * Assuming a numberical output, provide the totals of all the function outputs:
 *   zoe.fn.createReduction(0, function(out1, out2) {
 *     return out1 + out2;
 *   });
 *
 */
zoe_fn.executeReduce = function(startVal, reduce) {
  if (reduce === undefined) {
    reduce = startVal;
    startVal = undefined;
  }
  return function(self, args, fns) {
    var output = startVal;
    for (var i = 0; i < fns.length; i++)
      output = reduce(output, fns[i].apply(self, args));
    return output;
  }
}

/*
 * zoe.fn.LAST_DEFINED
 *
 * Executes all functions in the chain, returning the last non-undefined
 * output.
 *
 */
var l = zoe_fn.LAST_DEFINED = zoe_fn.executeReduce(function(out1, out2) {
  return out2 !== undefined ? out2 : out1;
});

/*
 * zoe.fn.STOP_DEFINED
 *
 * Runs the execution of fns, until one function returns
 * a non-undefined output.
 * Then no further functions are executed.
 *
 * Useful for any type of input ownership system, where functions
 * check if they should control output based on input, and as soon as one
 * triggers an output, we ignore execution of the others.
 * 
 */
zoe_fn.STOP_DEFINED = function STOP_DEFINED(self, args, fns) {
  var output;
  for (var i = 0; i < fns.length; i++) {
    output = fns[i].apply(self, args);
    if (output !== undefined)
      return output;
  }
  return output;
}
/*
 * zoe.fn.ASYNC
 *
 * Allows for the creation of an asynchronous step function, with the
 * last argument to each successive function being the 'next' callback
 * into the next function or final completion.
 *
 * Example:
 *   var f = zoe.fn(zoe.fn.ASYNC);
 *
 *   f.on(function(any, number, of, args, next) {
 *     setTimeout(complete, 5000);
 *   });
 *
 *   f.on(function(same, number, of, args, next) {
 *     console.log('complete');
 *   });
 *
 *   f(function() {
 *     //all done (optional function)
 *   }); // waits 5 seconds, then prints complete
 *
 */
zoe_fn.ASYNC = zoe_fn.ASYNC_NEXT = function ASYNC_NEXT(self, args, fns) {
  var i = 0;
  var complete;
  if (typeof args[args.length - 1] == 'function')
    complete = args.pop();
  var makeNext = function(i) {
    return function() {
      if (fns[i])
        fns[i].apply(self, args.concat([makeNext(i + 1)]));
      else if (complete)
        complete();
    }
  }
  return makeNext(0)();
}

zoe_fn.ASYNC_SIM = function ASYNC_SIM(self, args, fns) {
  var completed = 0;
  var complete;
  if (typeof args[args.length - 1] == 'function')
    complete = args.pop();
  for (var i = 0; i < fns.length; i++)
    fns[i].apply(self, args.concat([function() {
      if (++completed == fns.length)
        complete();
    }]));
}

/*
 * zoe.on
 *
 * Shorthand for converting any function to a chain
 * Effectively duck punching using zoe.fn, but if the
 * function is already a zoe.fn, it is just added to the
 * list (using less memory than recursive duck punching)
 *
 * Usage:
 *
 * //given an existing object:
 * var obj = { sayHi: function() {} }
 *
 * //we can easily attach chains to its functions:
 * zoe.on(obj, 'sayHi', function() {
 * });
 *
 * Which is identical to:
 * obj.sayHi = zoe.fn(obj.sayHi);
 * obj.sayHi.on(function() {
 * });
 *
 * The corresponding zoe.off method works as with zoe.fn() off.
 *
 */
zoe.on = function(obj, name, f) {
  var val = obj[name];
  if (!val || val.constructor != zoe_fn || val.run != zoe_fn.LAST_DEFINED)
    obj[name] = zoe_fn(val ? [val] : []);
  obj[name].on(f);
}
zoe.off = function(obj, name, f) {
  if (obj[name].constructor == zoe_fn)
    return obj[name].off(f);
}



/*
 * zoe.extend
 * http://github.com/zestjs/zoe#zextend
 *
 * Extend obj A by merging properties from obj B
 * A flexible rules mechanism allows for advanced merging functions
 *
 * Usage:
 *
 * zoe.extend(objA, objB, [rules,]);
 *
 * objA: the object to modify (the host object)
 * objB: the object with the new properties to add (the extending object)
 * rules: a rule function or object map.
 *        typically rule functions are constant functions located at zoe.extend.RULE
 *        for convenience, these can also be referenced by a rule string, 'RULE'
 *
 *
 * Without any rules, zoe.extend does a straight merge, but will report an
 * error as soon as there is a property name clash and need for an override.
 * The error made is not thrown, but is a non-critical log message, but this
 * should always be resolved.
 *
 * To resolve property conflicts:
 *   1) Specify a rule function as the third argument
 *   2) Specify a rule map as the third argument
 *   3) Define property rules on the extending object with an 'underscore' rule notation
 *
 * 1. Rule Functions
 * --------------
 *
 * When a rule function is given, that function is used as the override mechanism
 * for copying properties from the extending object to the host object.
 *
 * A direct rule function is of the form:
 *
 * rule = function(p, q, rules) {
 *   return output;
 * }
 *
 * p: the property value on the host object
 * q: the property value on the extending object
 * rules: the derived rules at this level (only used for object extension with depth)
 * output: the new value to place on the host object
 *
 * If output is undefined, the property is not written at all.
 * 
 * For example, zoe.extend.REPLACE, is the rule function defined by:
 *
 * zoe.extend.REPLACE = function(p, q) {
 *   return q;
 * }
 *
 * This will overwrite properties on the host object with properties from
 * the extending object.
 *
 * 2. Rule Maps
 * ---------
 *
 * It can be more useful to explicitly define how properties should be overrided.
 * A rule specification allows for this.
 *
 * For example:
 *
 * {
 *   '*': zoe.extend.REPLACE
 *   'myproperty': zoe.extend.IGNORE
 * }
 * 
 * Both zoe.extend.REPLACE and $.extend.IGNORE are provided rule functions.
 *
 * In the above example, all properties get replaced, except for the property
 * 'myproperty' which gets ignored entirely.
 *
 *
 * Depth can also be specified in the rules specification. For example:
 *
 * {
 *   'object_property': zoe.extend
 *   'object_property.*': zoe.extend.REPLACE
 * }
 *
 * The above will extend 'object_property', passing the rule specification
 * for to this extend function to replace all sub properties.
 *
 * 
 *
 * 3. Underscore Rule Notation
 * ---------------------------
 *
 * When defining a property, it can be more convenient to indicate the extension
 * rule as part of the property name instead of through separate rules.
 *
 * In this case, an underscore notation can be used.
 *
 * __propertyName -> use the zoe.extend.APPEND rule
 * propertyName__ -> use the zoe.extend.PREPEND rule
 * __propertyName__ -> use the zoe.extend.REPLACE rule
 *
 *
 * For example:
 *
 *   var a = { text: 'hello ' };
 *
 *   zoe.extend(a, { __text: 'world' });
 *
 *   //outputs a = { text: 'hello world' }
 *
 * Will automatically apply the zoe.extend.APPEND rule to the 'text' property,
 * as if it were written:
 *
 *   zoe.extend(a, { text: 'world'}, { text: zoe.extend.STR_APPEND });
 *
 * By default, the APPEND rule will:
 *  - chain together functions as zoe.fn() chains
 *  - extend objects with replacement
 *  - append strings
 *  - concatenate arrays
 *
 * By default, the PREPEND rule will:
 *  - chain together functions as zoe.fn() chains, but first in the execution chain
 *  - extend objects with the fill rule, replacing properties not already defined only
 *  - prepend strings
 *  - reverse concatenate arrays
 *
 *  
 *
 * Provided Rule Functions
 * -----------------------
 *
 * zoe.extend provides a number of override functions to use. These are:
 *
 *   zoe.extend.DEFINE
 *   -create a property, but throw a soft error and ignore if the property already exists.
 *   -this is the default rule for extension when no other rule is specified
 * 
 *   zoe.extend.REPLACE
 *   -direct replace, by reference for objects and functions
 * 
 *   zoe.extend.FILL
 *   -only adds the value if it doesn't already exist.
 *   -This method effectively 'fills in' any properties which aren't already
 *    defined.
 *
 *   zoe.extend.DREPLACE (deep replace)
 *   -direct replace for all property types except object
 *   -when a native object is encountered for replacement,
 *    it is in turn recursively replaced onto the object, creating a deep copying.
 *
 *   zoe.extend.DFILL (deep fill)
 *   -analogously, provides property values when not already there, when not an object.
 *   -when an object is provided, it fills in properties on the subobject that aren't
 *    already defined
 *
 *   zoe.extend.IGNORE
 *   -completely leaves the property out of the extension process
 * 
 *   zoe.extend.STR_APPEND
 *   -assuming properties are strings, it appends them together
 *
 *   zoe.extend.STR_PREPEND
 *   -assuming properties are strings, the reverse concatenation of the above
 *   
 *   zoe.extend.ARR_APPEND
 *   -assuming properties are arrays, they are concatenated
 *   
 *   zoe.extend.ARR_PREPEND
 *   -assuming properties are arrays, they are reverse concatenated
 *
 *
 * zoe.fn Extension Rules:
 *
 * A natural way to extend functions is to convert them into instances of zoe.fn, if not
 * already, and have the extension added to the list of functions in the execution chain.
 *
 * The following extension rules for zoe.fn allow this
 *
 *   zoe.extend.CHAIN
 *   -if not already a chain, convert the host property into a zoe.fn instance, with execution
 *    function, zoe.fn.LAST_DEFINED
 *   -adds the extend property to the chain with the 'on' method
 *
 *   zoe.extend.CHAIN_FIRST
 *   -as with chain, but applies the 'first' method to add the item at the beginning of the chain
 *
 * When extending properties, you may wish to use another chain to do the extension. In this case,
 * the helper function, zoe.extend.makeChain will generate an extension function base on the provided
 * zoe.fn execution function.
 *
 *   zoe.extend.makeChain(EXECUTION_FUNCTION, first)
 *
 *   EXECUTION_FUNCTION is the zoe.fn execution function to use
 *   first is an optional boolean indicating whether the chain should use 'on' or 'first'
 *
 * For example, zoe.extend.CHAIN is created by:
 *
 *   zoe.extend.CHAIN = zoe.extend.makeChain(zoe.fn.LAST_DEFINED)
 *
 *
 * Append and Prepend Rules:
 *
 *   zoe.extend.APPEND
 *   -chains functions, replaces objects, appends strings, concatenates arrays
 *
 *   zoe.extend.PREPEND
 *   -chains functions with 'first', fills objects, prepends strings
 *    and reverse concatenates arrays
 *
 *   zoe.extend.DAPPEND
 *   -chains functions, recursively deep appends objects, concatenates arrays
 *
 *   zoe.extend.DPREPEND
 *   -chains functions, recursively deep prepends objects, prepends arrays
 *
 *
 * Making custom rules:
 *
 * Adding additional rule functions onto zoe.extend is encouraged, but the above should
 * never be changed.
 * 
 * When the type checking for an extend method is very specific, simply throw an error
 * to indicate a bad input. This will be caught by zoe.extend and output as a console.log
 * warning instead.
 *
 *
 * Examples
 * --------
 *
 * 1. Cloning an object at the first level:
 *
 *    zoe.extend({}, obj);
 *
 * 2. Cloning an object to all depths:
 *
 *    zoe.extend({}, obj, zoe.extend.DREPLACE);
 *
 * 3. Providing default configuration on a nested configuration object:
 *
 *    zoe.extend(config, default_config, zoe.extend.DEEP_FILL);
 *
 * 4. Custom extension with automatic type adjustment
 *
 *    var Heading = {
 *      template: function(text) {
 *        return '<h1>' + text + '</h1>';
 *      },
 *      css: 'font-size: 12px;'
 *    };
 *    var Red = {
 *      css: 'color: red;'
 *    }
 *
 *    zoe.extend(Heading, Red, {
 *      css: zoe.extend.STR_APPEND
 *    });
 *
 *    returns Heading = {
 *      template: function(text) {
 *        return '<h1>' + text + '</h1>';
 *      },
 *      css: 'font-size: 12px;color: red;'
 *    };
 *
 *
 *    This demonstrates the primary use case for zoe.extend rules -
 *    the ability to have a flexible object inheritance mechanism for web components.
 * 
 */
//also allows multiple extension: extend(a, b, c, d, e, rule). But then rule must be specified.
var zoe_extend = zoe.extend = function extend(a, b, rule) {
  var _arguments = arguments;
  if (_arguments.length > 2)
    rule = _arguments[_arguments.length - 1];
  
  var ruleObj;
  if (typeof rule == 'object') {
    ruleObj = rule;
    rule = void 0;
  }
  
  for (var p in b)
    if (!b.hasOwnProperty || b.hasOwnProperty(p)) {
      var v = b[p];
      var out;
      
      var pLength = p.length;
      var firstUnderscores = p.substr(0, 2) == '__';
      var lastUnderscores = p.substr(pLength - 2, 2) == '__';
      
      //a fancy (minifies better) way of setting the underscore rules to the appropriate extend function
      var underscoreRule = (firstUnderscores && !lastUnderscores && (p = p.substr(2)) && zoe_extend.APPEND)
        || (!firstUnderscores && lastUnderscores && (p = p.substr(0, pLength - 2)) && zoe_extend.PREPEND)
        || (firstUnderscores && lastUnderscores && (p = p.substr(2, pLength - 4)) && zoe_extend.REPLACE);
      
      //apply the right rule function
      var curRule = (underscoreRule || rule || (ruleObj && (ruleObj[p] || ruleObj['*'])) || zoe_extend.DEFINE);
      
      //allow rules to be strings
      if (typeof curRule == 'string')
        curRule = zoe_extend[curRule];
      
      try {
        out = curRule(a[p], v, ruleObj && zoe_extend.deriveRules(ruleObj, p));
      }
      catch (er) {
        zoe.dir(a);
        zoe.dir(b);
        zoe.dir(zoe_extend.deriveRules(rule, p));
        zoe.log('zoe.extend: "' + p + '" override error. \n ->' + (er.message || er));
      }
      if (out !== undefined)
        a[p] = out;
    }
    
  //multiple extension
  if (_arguments.length > 3) {
    var args = [a];
    args.concat(Array.prototype.splice.call(_arguments, 2, _arguments.length - 3, _arguments.length - 3));
    args.push(rule);
    $z.extend.apply(this, args);
  }
  
  return a;
}

zoe_extend.EXTEND = zoe_extend;
zoe_extend.DEFINE = function DEFINE(a, b) {
  if (a !== undefined)
    throw 'No override specified.';
  else
    return b;
}
var r = zoe_extend.REPLACE = function REPLACE(a, b) {
  if (b !== undefined)
    return b;
  else
    return a;
}
zoe_extend.FILL = function FILL(a, b) {
  if (a === undefined)
    return b;
  else
    return a;
}
var i = zoe_extend.IGNORE = function IGNORE(a, b) {}
var is_obj = function(obj) {
  return obj != null && obj.constructor == Object;
}
var is_fn = function(obj) {
  return typeof obj == 'function';
}
var is_str = function(obj) {
  return typeof obj == 'string';
}
var is_arr = function(obj) {
  return obj instanceof Array;
}
zoe_extend.APPEND = function APPEND(a, b, rules) {
  if (is_obj(b))
    return zoe_extend(a || {}, b, zoe_extend(rules || {}, {'*': 'REPLACE'}, 'FILL'));
  else if (is_fn(b))
    return zoe_extend.CHAIN(a, b);
  else if (is_str(b))
    return zoe_extend.STR_APPEND(a, b);
  else if (is_arr(b))
    return zoe_extend.ARR_APPEND(a, b);
  else
    return b;
}
zoe_extend.PREPEND = function PREPEND(a, b, rules) {
  if (is_obj(b))
    return zoe_extend(a || {}, b, zoe_extend(rules || {}, {'*': 'FILL'}, 'FILL'));
  else if (is_fn(b))
    return zoe_extend.CHAIN_FIRST(a, b);
  else if (is_str(b))
    return zoe_extend.STR_PREPEND(a, b);
  else if (is_arr(b))
    return zoe_extend.ARR_PREPEND(a, b);
  else
    return b;
}
zoe_extend.DAPPEND = function DAPPEND(a, b, rules) {
  if (is_obj(b))
    return zoe_extend(a || {}, b, zoe_extend(rules || {}, {'*': 'DAPPEND'}, 'FILL'));
  else if (is_fn(b))
    return zoe_extend.CHAIN(a, b);
  else if (is_arr(b))
    return zoe_extend.ARR_APPEND(a, b);
  else
    return b;
}
zoe_extend.DPREPEND = function DPREPEND(a, b, rules) {
  if (is_obj(b))
    return zoe_extend(a || {}, b, zoe_extend(rules || {}, {'*': 'DPREPEND'}, 'FILL'));
  else if (is_fn(b))
    return zoe_extend.CHAIN_FIRST(a, b);
  else if (is_arr(b))
    return zoe_extend.ARR_PREPEND(a, b);
  else
    return a !== undefined ? a : b;
}
zoe_extend.DREPLACE = function DREPLACE(a, b, rules) {
  if (is_obj(b))
    return zoe_extend(a || {}, b, zoe_extend(rules || {}, {'*': 'DREPLACE'}, 'FILL'));
  else
    return b;
}
zoe_extend.DFILL = function DFILL(a, b, rules) {
  if (is_obj(b))
    return zoe_extend(a || {}, b, 'DFILL');
  else
    return typeof a == 'undefined' ? b : a;
}
zoe_extend.ARR_APPEND = function ARR_APPEND(a, b) {
  return (a || []).concat(b);
}
zoe_extend.ARR_PREPEND = function ARR_PREPEND(a, b) {
  return b.concat(a || []);
}
zoe_extend.STR_APPEND = function STR_APPEND(a, b) {
  return a ? a + b : b;
}
zoe_extend.STR_PREPEND = function STR_PREPEND(a, b) {
  return b + a;
}


/*
 create a rule for a property object from a rules object
 eg rules = { 'prototype.init': zoe.extend.APPEND, '*.init': zoe.extend.REPLACE, '*.*': zoe.extend.REPLACE }
 
 then deriveRule(rules, 'prototype') == { 'init': zoe.extend.APPEND, 'init': zoe.extend.REPLACE, '*.*': zoe.extend.REPLACE }
*/
zoe_extend.deriveRules = function(rules, p) {
  var newRules = {};
  
  for (var r in rules) {
    if (r == '*.*') {
      newRules['*.*'] = rules[r];
      continue;
    }
    
    if (r == '*')
      continue;
    
    var parts = r.split('.');
    if (parts[0] == p || parts[0] == '*')
      newRules[parts.splice(1).join('.')] = rules[r];
  }
  
  return newRules;
}
/*
 * zoe.extend.makeChain
 *
 * Creates a zoe.extend rule that will automatically
 * combine functions with the given execution function
 *
 * Usage:
 *   zoe.extend.makeChain(EXECUTION_FUNCTION [, first]);
 *
 * When the 'first' parameter is provided, this creates
 * a reverse chain putting the new items at the beginning of the
 * function list to be executed.
 *
 * The 'ignoreExecution' property exists to check if we want to
 * override the execution function on the chain if one already exists.
 *
 * zoe.extend.CHAIN is a weak extension rule as it will append to whatever
 * chain already exists on the host object, by setting this flag to true.
 *
 * Example:
 *
 *   var Load = {
 *     load: function(complete) {
 *       setTimeout(complete, 1000);
 *     }
 *   }
 *   var LoadExtra = {
 *     load: function(complete) {
 *       setTimeout(complete, 2000);
 *     }
 *   }
 *
 *   zoe.extend(Load, LoadExtra, {
 *     load: zoe.fn.makeChain(zoe.fn.ASYNC)
 *   });
 *
 *   Load.load(); // takes 3 seconds to complete
 *
 */

zoe_extend.makeChain = function(executionFunction, first, ignoreExecution) {
  return function(a, b) {
    if (!a || a.constructor != zoe_fn || (!ignoreExecution && a.run != executionFunction))
      a = zoe_fn(executionFunction, !a ? [] : [a]);
    
    if (first)
      a.first(b);
    else
      a.on(b);
    
    return a;
  }
}

// create the zoe.extend rules for the corresponding function chain methods.
zoe_extend.CHAIN = zoe_extend.makeChain(zoe_fn.LAST_DEFINED, false, true);
zoe_extend.CHAIN_FIRST = zoe_extend.makeChain(zoe_fn.LAST_DEFINED, true, true);
zoe_extend.CHAIN_STOP_DEFINED = zoe_extend.makeChain(zoe_fn.STOP_DEFINED);



/*
 * zoe.create
 * JavaScript object inheritance
 * http://github.com/zestjs/zoe#zcreate
 *
 * Usage:
 * 
 *   zoe.create(def)
 *   Creates a new instance of the class defined by def.
 *
 *   zoe.create([inherits], def)
 *   Creates a new instance of the class defined by def, with the given inheritance.
 *
 * zoe.create simply uses zoe.extend to copy the def into a new object.
 *
 * Example:
 *
 *   zoe.create({hello: 'world'});
 *
 * Will simply copy the definition object, and output the exact copy.
 *
 * Inheritance then repeats the above process, implementing the definitions in order
 * onto the target object.
 *
 * There are then 7 special optional properties on the definition object which will be picked
 * up when performing zoe.create. These properties allow for a natural but flexible class
 * inheritance model in JavaScript
 *
 *   1. _base:
 *   
 *     A function that creates a new instance of the base object for extension.
 *     In this way, we can create onto functions (and thus constructors), or any other JavaScript type.
 *     If not provided, the default _base function used is:
 *
 *     _base = function() { return {}; }
 *
 *     allowing for standard object creation.
 *
 *     When multiple _base properties are provided, the lowest inheritor in the stack is used.
 *
 *   2. _extend:
 *
 *     If an _extend property is provided, this property will be used as the zoe.extend rules specification.
 *     By default, this _extend object is automatically overwritten by any successive _extend properties implemented.
 *     In this way, a class can hold its own extensible property extension rules.
 *
 *   3. _implement:
 *
 *     This acts in exactly the same way as calling zoe.create with an array of inheritors.
 *
 *   4. _reinherit:
 *
 *     Rarely used, merely a technical formality for flexibility in the diamond problem.
 *     
 *     To avoid the diamond problem, inheritance is tracked during the zoe.create call. Double inheritance
 *     is then avoided. If a class definition can be implemented multiple times on the same object,
 *     set the _reinherit flag to true.
 *
 *   5. _make:
 *
 *     It may be necessary to have a function that does the creation of a definition, instead of just
 *     property extension.
 *
 *     In this case a make function can be provided:
 *
 *     eg:
 *     _make = function(createDefinition, makeDefinition) {
 *       this.customProperty = 'made a custom property';
 *       if (createDefinition.dynamic)
 *         this.dynamicProperty = 'hello';
 *     }
 *
 *     createDefinition is the primary definition provided into zoe.create.
 *
 *     makeDefinition is the definition currently being implemented from the _implement array, and is
 *     the same as the definition that would define the above _make function.
 *
 *     'this' is bound to the output object.
 *
 *   6. _integrate:
 *
 *     A make function only has control over the current definition in the list of implementors.
 *
 *     Sometimes it can be useful to allow an inheritor more control by having a hook run before each
 *     further implementor from the inheritance list is applied.
 *
 *     Integrate functions are the first hook on each inheritor. They run for all inheritors that
 *     are placed after the inheritor with the integrate hook.
 *
 *     
 *     _integrate = function(makeDefinition, createDefinition) {
 *       //can check and modify the output object, accessed as 'this'
 *     }
 *     
 *     makeDefinition: the current definition being implemented
 *     createDefinition: the primary definition in zoe.create
 *     'this': is bound to the output object
 *     
 *     return value:
 *     In some rare cases, it can be necessary to perform some mapping of the definition object first.
 *     In this case, a derived definition object can be returned which will be used instead.
 *     The primary use case for this is to allow standard JavaScript constructors as _implement items
 *     when implementing zoe.constructor objects.
 *
 *   7. _built:
 *
 *     If an inheritor wants to apply some final changes to the object after all the other inheritors
 *     have completed, then a built function can make final modifications.
 *
 *     eg, running an 'init' event
 *     _built = function(createDefinition) {
 *       this.trigger('init');
 *     }
 *
 *
 *  NOTE: For the _integrate, _make and _built functions, these should never modify the definition objects,
 *        only the output object.
 *         
 *        This is because definition objects are designed to be immutable, and should be able to be implemented
 *        with the same results at any later points.
 *
 *        The only modification made by zoe.create is automatically appending the _implement array of the primary
 *        definition when the inheritor form of zoe.create is used - zoe.create([inheritors], definition);
 *
 * 
 */
zoe.create = function(inherits, definition) {
  definition = inheritCheck(inherits, definition);
  
  if (definition._definition)
    throw "Cannot use zoe.create on an instance of zoe.create";
  
  //find base definition (first base defined)
  var obj;
  implementLoop(definition, function(item) {
    if (item._base) {
      obj = item._base(definition);
      return true;
    }
  });
  obj = obj || {};
  
  obj._definition = definition;
    
  var _extend = {
    _extend: zoe_extend.IGNORE,
    _base: zoe_extend.IGNORE,
    _implement: zoe_extend.IGNORE,
    _reinherit: zoe_extend.IGNORE,
    _make: zoe_extend.IGNORE,
    _integrate: zoe_extend.IGNORE,
    _built: zoe_extend.IGNORE
  };
  
  //state variables
  var _inherited = [];
  var _built = zoe_fn();
  var _integrate = zoe_fn();
  
  _integrate._this = _built._this = obj;
  
  implementLoop(definition, function loop(def) {
    
    def = _integrate(def, definition) || def;
    
    if (def._integrate)
      _integrate.on(def._integrate);
    
    zoe_extend(obj, def, _extend);
    
    if (def._extend)
      zoe_extend(_extend, def._extend, 'REPLACE');
  
    if (def._make)
      def._make.call(obj, definition, def);
      
    if (def._built)
      _built.on(def._built);
      
    _inherited.push(def);
    
  }, function skip(def) {
    //diamond problem
    // - skip double inheritance by default, lowest inheritor always used
    // - 'reinherit' property can specify to always rerun the inheritance at each repeat
    return _inherited.indexOf(def) != -1 && !def._reinherit
  });
  
  _built(definition);
  
  return obj;
}
/*
 * implementLoop
 * Helper function to walk the implements of a definition
 *
 * First, 'skip' is run (if it exists). If it returns true, the current node
 * is skipped entirely and we move to the next sibling.
 *
 * Then 'loop' runs on each item in the implements stack, traversing from leaf to branch
 * left to right.
 * 
 * As the process goes, definitions with a "_definition" property in the implement
 * array are cleaned to be direct definitions.
 *
 */
var implementLoop = function(def, loop, skip) {
  skip = skip || function() {}
  if (def._implement)
    for (var i = 0, len = def._implement.length; i < len; i++) {
      var item = def._implement[i];
      if (!item) {
        zoe.dir(def);
        zoe.log('Implementor not defined!');
      }

      if (item._definition) {
        item = item._definition;
        //cleaning disabled to allow requirejs module tracing
        //def.implement[i] = item;
      }
      
      if (skip(item))
        continue;
      
      if (implementLoop(item, loop, skip))
        return true;
    }
  return loop(def);
}

/*
 * Helper to allow for flexible forms of
 *
 * zoe.implement([], {})
 * zoe.implement({})
 * zoe.implement([])
 *
 * All compiling into the definition
 *
 */
var inheritCheck = function(inherits, definition) {
  if (!(inherits instanceof Array)) {
    definition = inherits;
    inherits = [];
  }
  definition = definition || {};
  definition._implement = inherits.concat(definition._implement || []);
  return definition;
}

/*
 * zoe.inherits
 *
 * A utility function to determine if an object has inherited
 * the provided definition.
 *
 */
zoe.inherits = function(obj, def) {
  if (obj._definition)
    return zoe.inherits(obj._definition, def);
  if (def._definition)
    return zoe.inherits(obj, def._definition);
    
  var match = false;
  implementLoop(obj, function(item) {
    if (item === def) {
      match = true;
      return true;
    }
  });
  
  return match;
}



/*
 * zoe.Constructor
 * http://github.com/zestjs/zoe#zconstructor
 *
 * A base inheritor definition for zoe.create that allows for javascript prototype construction
 * such that we can create a class that can be instantiated with the new keyword.
 *
 * Usage:
 *
 *   var Obj = zoe.create([zoe.Constructor], {
 *     construct: function(args) {
 *     },
 *     prototype: {
 *       prototype: 'property'
 *     }
 *   });
 *
 *   var p = new Obj(args);
 *
 * In this way, zoe.create and zoe.Constructor provide a convenience method for
 * building up constructable prototypes with multiple inheritance through definition objects.
 *
 * Additionally, once zoe.Constructor has been implemented, standard JavaScript classes written
 * natively can also be extended by adding them into the zoe.create implement list after zoe.Constructor.
 * 
 *
 * Extension
 * ---------
 *
 * By default, the prototype object is extended with any new properties.
 * The construct function is by default chained as an instance of zoe.fn() so that
 * many construct hooks can be created by each inheritor, all under obj.construct().
 *
 * The standard extension rules for zoe.create apply. Thus, to create an extension
 * rule on the prototype, simply add the rule to _extend.
 *
 * For example, an init event / chain:
 *
 * var def = {
 *   _implement: [zoe.Constructor],
 *   _extend: {
 *     'prototype.init': zoe.extend.CHAIN
 *   },
 *   construct: function() {
 *     this.init();
 *   },
 *   prototype: {
 *     init: function() {
 *     }
 *   }
 * }
 *
 */
zoe.Constructor = {
  _base: function(def) {
    function Constructor() {
      // http://github.com/zestjs/zoe#zcreate
      Constructor.construct.apply(this, arguments);
    }
    return Constructor;
  },
  _extend: {
    prototype: zoe_extend,
    construct: zoe_extend.CHAIN
  },
  _integrate: function(def) {
    //the prototype property is skipped if it isn't an enumerable property
    //thus we run the extension manually in this case
    var getPropertyDescriptor = Object.getOwnPropertyDescriptor;
    if (getPropertyDescriptor) {
      var p = getPropertyDescriptor(def, 'prototype');
      if (p && !p.enumerable)
        zoe_extend(this.prototype, def.prototype, zoe_extend.deriveRules(this._extend, 'prototype'));
    }

    //allow for working with standard prototypal inheritance as well    
    if (typeof def == 'function' && !def._definition)
      return {
        construct: def.construct,
        prototype: def
      };
  },
  construct: function() {
    //ALL function chains on the prototype made into instance chains
    //this allows instance-level function chaining
    //important to ensure modifications not made to the underlying prototype
    for (var p in this) {
      var curProperty = this[p];
      if (curProperty && curProperty.constructor == zoe_fn) {
        this[p] = zoe_fn(curProperty.run, [curProperty]);
        this[p].bind(this);
      }
    }
  }
};

return zoe;
}));
