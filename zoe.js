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
 * In the case of AMD and the browser, a global '$z' is created.
 * If a '$z' global already exists, it is extended with these methods.
 *
 *
 * Public Methods and Properties
 * -----------------------------
 *
 * The module defines the following methods.
 * Further documentation on their usage is provided with the code.
 *
 * Primary methods:
 * 1) $z.fn
 * 2) $z.extend
 * 3) $z.create
 *
 * Utility functions
 * -$z.log
 * -$z.dir
 *
 * 1) $z.fn
 *  execution functions:
 *  -$z.fn.STOP_DEFINED
 *  -$z.fn.LAST_DEFINED
 *  -$z.fn.ASYNC
 *
 *  helper functions:
 *  -$z.fn.executeReduce
 *  -$z.on
 *  -$z.off
 *
 * 2) $z.extend
 *  extension functions:
 *  -$z.extend.DEFINE
 *  -$z.extend.REPLACE
 *  -$z.extend.FILL
 *  -$z.extend.DREPLACE
 *  -$z.extend.DFILL
 *  -$z.extend.IGNORE
 *  -$z.extend.STR_APPEND
 *  -$z.extend.STR_PREPEND
 *  -$z.extend.ARR_APPEND
 *  -$z.extend.ARR_PREPEND
 *  -$z.extend.APPEND
 *  -$z.extend.PREPEND
 *
 *  function chain extension utility function:
 *  -$z.extend.makeChain
 *
 *  function chain extension functions:
 *  -$z.extend.CHAIN
 *  -$z.extend.CHAIN_FIRST
 *  -$z.extend.CHAIN_STOP_DEFINED
 *
 * 3) $z.create
 *  helper function:
 *  -$z.inherits
 *
 *  core inheritor:
 *  -$z.Constructor
 * 
 */

(function (root, factory) {
  //nodejs
  if (typeof exports === 'object')
    module.exports = factory();
  //amd + $z global
  else if (typeof define === 'function' && define.amd)
    define(function() {
      return (root.$z = factory(root.$z));
    });
  //browser $z global
  else
    root.$z = factory(root.$z);
}(this, function ($z) {
  
//if a $z global already exists, extend it with these methods (used by Zest)
$z = $z || function() { return $z.main.apply(this, arguments); }

/*
 * $z.log, $z.dir
 * Console log function existence wrappers
 * 
 */
$z.log = $z.dir = function(){};
if (typeof console !== 'undefined') {
  if (console.log)
    $z.log = function(str) { console.log(str); }
  if (console.dir)
    $z.dir = function(obj) { console.dir(obj); }
}


/*
 * $z.fn
 * Flexible function composition
 * http://github.com/zestjs/zoe#zfn
 *
 *
 * The basic concept is that there are many situations when designing software that
 * involve the execution of arrays of functions.
 * $z.fn provides a flexible way of managing the execution of arrays of functions
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
 * All of the above cases can be handled by the use of $z.fn.
 *
 * $z.fn is a factory function that returns a fresh function instance, which wraps
 *   an array of functions.
 * It takes an optional specified execution rule and list of initial functions.
 * Additional functions can be added to the wrapper on at any time by using the f.on() syntax.
 * 
 *
 * Usage:
 *   $z.fn(executionFunction, [initialFunctions]);
 *   $z.fn(executionFunction);
 *   $z.fn([initialFunctions]);
 * 
 * [initialFunctions]: an array of the inital functions to be provided (optional)
 * executionFunction: the main execution function to handle function execution and output (optional)
 *    when no executionFunction is provided, defaults to $z.fn.LAST_DEFINED
 *
 * output: a function instance of a $z.fn 'function chain', with the following public properties:
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
 *  var clickEvent = $z.fn();
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
 *    $z.fn.executeReduce(initialValue, function(output1, output2) {
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
 * The default composition function used by $z.fn() is $z.fn.LAST_DEFINED.
 * This function returns the output from the last function in the list to return a non-undefined output.
 *
 * It is written as:
 *
 * $z.fn.LAST_DEFINED = $z.fn.executeReduce(function(output1, output2) {
 *   return output2 !== undefined ? output2 : output1;
 * });
 *
 * It works as the reduction is applied in order along the list of outputs.
 *
 *
 * The full list of provided composition functions is covered below.
 *
 * $z.fn.LAST_DEFINED
 * $z.fn.STOP_DEFINED
 * $z.fn.ASYNC
 *
 * Documentation on these is given below.
 * 
 */

var f = $z.fn = function(run, fns) {
  if (run instanceof Array) {
    fns = run;
    run = null;
  }
  
  var instance = function() {
    //http://github.com/zestjs/zoe#zfn
    return instance.run(instance._this || this, Array.prototype.splice.call(arguments, 0), instance.fns);
  }
  
  instance.constructor = f;
  
  instance.fns = fns || [];
  instance.run = run || $z.fn.LAST_DEFINED;
  
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

/* $z.fn.executeReduce
 * 
 * A helper function in building synchronous composition functions
 * takes a "reduce" function to amalgamating synchronous outputs into a
 * single output
 *
 * Usage:
 *   $z.fn.executeReduce(startVal, function(out1, out2) {
 *     return reducedOutput;
 *   });
 *
 * Example:
 *
 * Assuming a numberical output, provide the totals of all the function outputs:
 *   $z.fn.createReduction(0, function(out1, out2) {
 *     return out1 + out2;
 *   });
 *
 */
$z.fn.executeReduce = function(startVal, reduce) {
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
 * $z.fn.LAST_DEFINED
 *
 * Executes all functions in the chain, returning the last non-undefined
 * output.
 *
 */
var l = $z.fn.LAST_DEFINED = $z.fn.executeReduce(function(out1, out2) {
  return out2 !== undefined ? out2 : out1;
});

/*
 * $z.fn.STOP_DEFINED
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
$z.fn.STOP_DEFINED = function STOP_DEFINED(self, args, fns) {
  var output;
  for (var i = 0; i < fns.length; i++) {
    output = fns[i].apply(self, args);
    if (output !== undefined)
      return output;
  }
  return output;
}
/*
 * $z.fn.ASYNC
 *
 * Allows for the creation of an asynchronous step function, with the
 * last argument to each successive function being the 'next' callback
 * into the next function or final completion.
 *
 * Example:
 *   var f = $z.fn($z.fn.ASYNC);
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
$z.fn.ASYNC = function ASYNC(self, args, fns) {
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

/*
 * $z.on
 *
 * Shorthand for converting any function to a chain
 * Effectively duck punching using $z.fn, but if the
 * function is already a $z.fn, it is just added to the
 * list (using less memory than recursive duck punching)
 *
 * Usage:
 *
 * //given an existing object:
 * var obj = { sayHi: function() {} }
 *
 * //we can easily attach chains to its functions:
 * $z.on(obj, 'sayHi', function() {
 * });
 *
 * Which is identical to:
 * obj.sayHi = $z.fn(obj.sayHi);
 * obj.sayHi.on(function() {
 * });
 *
 * The corresponding $z.off method works as with $z.fn() off.
 *
 */
$z.on = function(obj, name, f) {
  var val = obj[name];
  if (!val || val.constructor != $z.fn || val.run != $z.fn.LAST_DEFINED)
    obj[name] = $z.fn(val ? [val] : []);
  obj[name].on(f);
}
$z.off = function(obj, name, f) {
  if (obj[name].constructor == $z.fn)
    return obj[name].remove(f);
}



/*
 * $z.extend
 * http://github.com/zestjs/zoe#zextend
 *
 * Extend obj A by merging properties from obj B
 * A flexible rules mechanism allows for advanced merging functions
 *
 * Usage:
 *
 * $z.extend(objA, objB, [rules,]);
 *
 * objA: the object to modify (the host object)
 * objB: the object with the new properties to add (the extending object)
 * rules: a rule function or object map.
 *        typically rule functions are constant functions located at $z.extend.RULE
 *        for convenience, these can also be referenced by a rule string, 'RULE'
 *
 *
 * Without any rules, $z.extend does a straight merge, but will report an
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
 * For example, $z.extend.REPLACE, is the rule function defined by:
 *
 * $z.extend.REPLACE = function(p, q) {
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
 *   '*': $z.extend.REPLACE
 *   'myproperty': $z.extend.IGNORE
 * }
 * 
 * Both $z.extend.REPLACE and $.extend.IGNORE are provided rule functions.
 *
 * In the above example, all properties get replaced, except for the property
 * 'myproperty' which gets ignored entirely.
 *
 *
 * Depth can also be specified in the rules specification. For example:
 *
 * {
 *   'object_property': $z.extend
 *   'object_property.*': $z.extend.REPLACE
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
 * __propertyName -> use the $z.extend.APPEND rule
 * propertyName__ -> use the $z.extend.PREPEND rule
 * __propertyName__ -> use the $z.extend.REPLACE rule
 *
 *
 * For example:
 *
 *   var a = { text: 'hello ' };
 *
 *   $z.extend(a, { __text: 'world' });
 *
 *   //outputs a = { text: 'hello world' }
 *
 * Will automatically apply the $z.extend.APPEND rule to the 'text' property,
 * as if it were written:
 *
 *   $z.extend(a, { text: 'world'}, { text: $z.extend.STR_APPEND });
 *
 * By default, the APPEND rule will:
 *  - chain together functions as $z.fn() chains
 *  - extend objects with replacement
 *  - append strings
 *  - concatenate arrays
 *
 * By default, the PREPEND rule will:
 *  - chain together functions as $z.fn() chains, but first in the execution chain
 *  - extend objects with the fill rule, replacing properties not already defined only
 *  - prepend strings
 *  - reverse concatenate arrays
 *
 *  
 *
 * Provided Rule Functions
 * -----------------------
 *
 * $z.extend provides a number of override functions to use. These are:
 *
 *   $z.extend.DEFINE
 *   -create a property, but throw a soft error and ignore if the property already exists.
 *   -this is the default rule for extension when no other rule is specified
 * 
 *   $z.extend.REPLACE
 *   -direct replace, by reference for objects and functions
 * 
 *   $z.extend.FILL
 *   -only adds the value if it doesn't already exist.
 *   -This method effectively 'fills in' any properties which aren't already
 *    defined.
 *
 *   $z.extend.DREPLACE (deep replace)
 *   -direct replace for all property types except object
 *   -when a native object is encountered for replacement,
 *    it is in turn recursively replaced onto the object, creating a deep copying.
 *
 *   $z.extend.DFILL (deep fill)
 *   -analogously, provides property values when not already there, when not an object.
 *   -when an object is provided, it fills in properties on the subobject that aren't
 *    already defined
 *
 *   $z.extend.IGNORE
 *   -completely leaves the property out of the extension process
 * 
 *   $z.extend.STR_APPEND
 *   -assuming properties are strings, it appends them together
 *
 *   $z.extend.STR_PREPEND
 *   -assuming properties are strings, the reverse concatenation of the above
 *   
 *   $z.extend.ARR_APPEND
 *   -assuming properties are arrays, they are concatenated
 *   
 *   $z.extend.ARR_PREPEND
 *   -assuming properties are arrays, they are reverse concatenated
 *
 *
 * $z.fn Extension Rules:
 *
 * A natural way to extend functions is to convert them into instances of $z.fn, if not
 * already, and have the extension added to the list of functions in the execution chain.
 *
 * The following extension rules for $z.fn allow this
 *
 *   $z.extend.CHAIN
 *   -if not already a chain, convert the host property into a $z.fn instance, with execution
 *    function, $z.fn.LAST_DEFINED
 *   -adds the extend property to the chain with the 'on' method
 *
 *   $z.extend.CHAIN_FIRST
 *   -as with chain, but applies the 'first' method to add the item at the beginning of the chain
 *
 * When extending properties, you may wish to use another chain to do the extension. In this case,
 * the helper function, $z.extend.makeChain will generate an extension function base on the provided
 * $z.fn execution function.
 *
 *   $z.extend.makeChain(EXECUTION_FUNCTION, first)
 *
 *   EXECUTION_FUNCTION is the $z.fn execution function to use
 *   first is an optional boolean indicating whether the chain should use 'on' or 'first'
 *
 * For example, $z.extend.CHAIN is created by:
 *
 *   $z.extend.CHAIN = $z.extend.makeChain($z.fn.LAST_DEFINED)
 *
 *
 * Append and Prepend Rules:
 *
 *   $z.extend.APPEND
 *   -chains functions, replaces into objects, appends strings, concatenates arrays
 *
 *   $z.extend.PREPEND
 *   -chains functions with 'first', fills objects where properties not defined, prepends strings
 *    and reverse concatenates arrays
 *
 *
 *
 * Making custom rules:
 *
 * Adding additional rule functions onto $z.extend is encouraged, but the above should
 * never be changed.
 * 
 * When the type checking for an extend method is very specific, simply throw an error
 * to indicate a bad input. This will be caught by $z.extend and output as a console.log
 * warning instead.
 *
 *
 * Examples
 * --------
 *
 * 1. Cloning an object at the first level:
 *
 *    $z.extend({}, obj);
 *
 * 2. Cloning an object to all depths:
 *
 *    $z.extend({}, obj, $z.extend.DREPLACE);
 *
 * 3. Providing default configuration on a nested configuration object:
 *
 *    $z.extend(config, default_config, $z.extend.DEEP_FILL);
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
 *    $z.extend(Heading, Red, {
 *      css: $z.extend.STR_APPEND
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
 *    This demonstrates the primary use case for $z.extend rules -
 *    the ability to have a flexible object inheritance mechanism for web components.
 * 
 */

var e = $z.extend = function extend(a, b, rule) {
  
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
      var underscoreRule = (firstUnderscores && !lastUnderscores && (p = p.substr(2)) && $z.extend.APPEND)
        || (!firstUnderscores && lastUnderscores && (p = p.substr(0, pLength - 2)) && $z.extend.PREPEND)
        || (firstUnderscores && lastUnderscores && (p = p.substr(2, pLength - 4)) && $z.extend.REPLACE);
      
      //apply the right rule function
      var curRule = (underscoreRule || rule || (ruleObj && (ruleObj[p] || ruleObj['*'])) || $z.extend.DEFINE);
      
      //allow rules to be strings
      if (typeof curRule == 'string')
        curRule = $z.extend[curRule];
      
      try {
        out = curRule(a[p], v, ruleObj && $z.extend.deriveRules(ruleObj, p));
      }
      catch (er) {
        $z.dir(a);
        $z.dir(b);
        $z.dir($z.extend.deriveRules(rule, p));
        $z.log('$z.extend: "' + p + '" override error. \n ->' + (er.message || er));
      }
      if (out !== undefined)
        a[p] = out;
    }
  return a;
}

$z.extend.DEFINE = function DEFINE(a, b) {
  if (a !== undefined)
    throw 'No override specified.';
  else
    return b;
}
var r = $z.extend.REPLACE = function REPLACE(a, b) {
  if (b !== undefined)
    return b;
  else
    return a;
}
$z.extend.FILL = function FILL(a, b) {
  if (a === undefined)
    return b;
  else
    return a;
}
var i = $z.extend.IGNORE = function IGNORE(a, b) {}
$z.extend.APPEND = function APPEND(a, b, rules) {
  if (b.constructor === Object)
    return $z.extend(a || {}, b, $z.extend.REPLACE);
  else if (typeof b == 'function')
    return $z.extend.CHAIN(a, b);
  else if (typeof b == 'string')
    return $z.extend.STR_APPEND(a, b);
  else if (b instanceof Array)
    return $z.extend.ARR_APPEND(a, b);
  else
    return b;
}
$z.extend.PREPEND = function PREPEND(a, b) {
  if (b.constructor === Object)
    return $z.extend(a || {}, b, $z.extend.FILL);
  else if (typeof b == 'function')
    return $z.extend.CHAIN_FIRST(a, b);
  else if (typeof b == 'string')
    return $z.extend.STR_PREPEND(a, b);
  else if (b instanceof Array)
    return $z.extend.ARR_PREPEND(a, b);
  else
    return b;
}
$z.extend.DREPLACE = function DREPLACE(a, b) {
  if (b.constructor === Object) {
    if (typeof a === 'undefined')
      a = {};
    return $z.extend(a, b, $z.extend.DREPLACE);
  }
  else
    return b;
}
$z.extend.DFILL = function DFILL(a, b) {
  if (b.constructor === Object) {
    if (typeof a === 'undefined')
      a = {};
    return e(a, b, $z.extend.DFILL);
  }
  else
    return typeof a === 'undefined' ? b : a;
}
$z.extend.ARR_APPEND = function ARR_APPEND(a, b) {
  return (a || []).concat(b);
}
$z.extend.ARR_PREPEND = function ARR_PREPEND(a, b) {
  return b.concat(a || []);
}
$z.extend.STR_APPEND = function STR_APPEND(a, b) {
  return a ? a + b : b;
}
$z.extend.STR_PREPEND = function STR_PREPEND(a, b) {
  return b + a;
}


/*
 create a rule for a property object from a rules object
 eg rules = { 'prototype.init': $z.extend.APPEND, '*.init': $z.extend.REPLACE, '*.*': $z.extend.REPLACE }
 
 then deriveRule(rules, 'prototype') == { 'init': $z.extend.APPEND, 'init': $z.extend.REPLACE, '*.*': $z.extend.REPLACE }
*/
$z.extend.deriveRules = function(rules, p) {
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
 * $z.fn.makeChain
 *
 * Creates a $z.extend rule that will automatically
 * combine functions with the given execution function
 *
 * Usage:
 *   $z.fn.makeChain(EXECUTION_FUNCTION [, first]);
 *
 * When the 'first' parameter is provided, this creates
 * a reverse chain putting the new items at the beginning of the
 * function list to be executed.
 *
 * The 'ignoreExecution' property exists to check if we want to
 * override the execution function on the chain if one already exists.
 *
 * $z.fn.CHAIN is a weak extension rule as it will append to whatever
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
 *   $z.extend(Load, LoadExtra, {
 *     load: $z.fn.makeChain($z.fn.ASYNC)
 *   });
 *
 *   Load.load(); // takes 3 seconds to complete
 *
 */

$z.fn.makeChain = function(executionFunction, first, ignoreExecution) {
  return function(a, b) {
    if (!a || a.constructor != $z.fn || (!ignoreExecution && a.run != executionFunction))
      a = $z.fn(executionFunction, !a ? [] : [a]);
    
    if (first)
      a.first(b);
    else
      a.on(b);
    
    return a;
  }
}

// create the $z.extend rules for the corresponding function chain methods.
$z.extend.CHAIN = $z.fn.makeChain($z.fn.LAST_DEFINED, false, true);
$z.extend.CHAIN_FIRST = $z.fn.makeChain($z.fn.LAST_DEFINED, true, true);
$z.extend.CHAIN_STOP_DEFINED = $z.fn.makeChain($z.fn.STOP_DEFINED);



/*
 * $z.create
 * JavaScript object inheritance
 * http://github.com/zestjs/zoe#zcreate
 *
 * Usage:
 * 
 *   $z.create(def)
 *   Creates a new instance of the class defined by def.
 *
 *   $z.create([inherits], def)
 *   Creates a new instance of the class defined by def, with the given inheritance.
 *
 * $z.create simply uses $z.extend to copy the def into a new object.
 *
 * Example:
 *
 *   $z.create({hello: 'world'});
 *
 * Will simply copy the definition object, and output the exact copy.
 *
 * Inheritance then repeats the above process, implementing the definitions in order
 * onto the target object.
 *
 * There are then 7 special optional properties on the definition object which will be picked
 * up when performing $z.create. These properties allow for a natural but flexible class
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
 *     If an _extend property is provided, this property will be used as the $z.extend rules specification.
 *     By default, this _extend object is automatically overwritten by any successive _extend properties implemented.
 *     In this way, a class can hold its own extensible property extension rules.
 *
 *   3. _implement:
 *
 *     This acts in exactly the same way as calling $z.create with an array of inheritors.
 *
 *   4. _reinherit:
 *
 *     Rarely used, merely a technical formality for flexibility in the diamond problem.
 *     
 *     To avoid the diamond problem, inheritance is tracked during the $z.create call. Double inheritance
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
 *     createDefinition is the primary definition provided into $z.create.
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
 *     createDefinition: the primary definition in $z.create
 *     'this': is bound to the output object
 *     
 *     return value:
 *     In some rare cases, it can be necessary to perform some mapping of the definition object first.
 *     In this case, a derived definition object can be returned which will be used instead.
 *     The primary use case for this is to allow standard JavaScript constructors as _implement items
 *     when implementing $z.constructor objects.
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
 *        The only modification made by $z.create is automatically appending the _implement array of the primary
 *        definition when the inheritor form of $z.create is used - $z.create([inheritors], definition);
 *
 * 
 */
$z.create = function(inherits, definition) {
  definition = inheritCheck(inherits, definition);
  
  if (definition._definition)
    throw "Cannot use $z.create on an instance of $z.create";
  
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
    _extend: e.IGNORE,
    _base: e.IGNORE,
    _implement: e.IGNORE,
    _reinherit: e.IGNORE,
    _make: e.IGNORE,
    _integrate: e.IGNORE,
    _built: e.IGNORE
  };
  
  //state variables
  var _inherited = [];
  var _built = $z.fn();
  var _integrate = $z.fn();
  
  _integrate._this = _built._this = obj;
  
  implementLoop(definition, function loop(def) {
    
    def = _integrate(def, definition) || def;
    
    if (def._integrate)
      _integrate.on(def._integrate);
    
    $z.extend(obj, def, _extend);
    
    if (def._extend)
      $z.extend(_extend, def._extend, $z.extend.REPLACE);
  
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
        $z.dir(def);
        $z.log('Implementor not defined!');
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
 * $z.implement([], {})
 * $z.implement({})
 * $z.implement([])
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
 * $z.inherits
 *
 * A utility function to determine if an object has inherited
 * the provided definition.
 *
 */
$z.inherits = function(obj, def) {
  if (obj._definition)
    return $z.inherits(obj._definition, def);
  if (def._definition)
    return $z.inherits(obj, def._definition);
    
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
 * $z.Constructor
 * http://github.com/zestjs/zoe#zconstructor
 *
 * A base inheritor definition for $z.create that allows for javascript prototype construction
 * such that we can create a class that can be instantiated with the new keyword.
 *
 * Usage:
 *
 *   var Obj = $z.create([$z.Constructor], {
 *     construct: function(args) {
 *     },
 *     prototype: {
 *       prototype: 'property'
 *     }
 *   });
 *
 *   var p = new Obj(args);
 *
 * In this way, $z.create and $z.Constructor provide a convenience method for
 * building up constructable prototypes with multiple inheritance through definition objects.
 *
 * Additionally, once $z.Constructor has been implemented, standard JavaScript classes written
 * natively can also be extended by adding them into the $z.create implement list after $z.Constructor.
 * 
 *
 * Extension
 * ---------
 *
 * By default, the prototype object is extended with any new properties.
 * The construct function is by default chained as an instance of $z.fn() so that
 * many construct hooks can be created by each inheritor, all under obj.construct().
 *
 * The standard extension rules for $z.create apply. Thus, to create an extension
 * rule on the prototype, simply add the rule to _extend.
 *
 * For example, an init event / chain:
 *
 * var def = {
 *   _implement: [$z.Constructor],
 *   _extend: {
 *     'prototype.init': $z.extend.CHAIN
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
$z.Constructor = {
  _base: function(def) {
    function Constructor() {
      // http://github.com/zestjs/zoe#zcreate
      return Constructor.construct.apply(this, arguments);
    }
    return Constructor;
  },
  _extend: {
    prototype: e,
    construct: e.CHAIN
  },
  _integrate: function(def) {
    //the prototype property is skipped if it isn't an enumerable property
    //thus we run the extension manually in this case
    if (Object.getOwnPropertyDescriptor) {
      console.log(def);
      var p = Object.getOwnPropertyDescriptor(def, 'prototype');
      if (p && !p.enumerable)
        $z.extend(this.prototype, def.prototype, $z.extend.deriveRules(this._extend, 'prototype'));
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
      if (curProperty && curProperty.constructor == $z.fn)
        this[p] = $z.fn(curProperty.run, [curProperty]);
    }
  }
};

return $z;
}));