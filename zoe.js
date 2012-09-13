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
 * Methods
 * -------
 *
 * The module defines the following methods.
 * Further documentation on their usage is provided with the code.
 *
 * Primary extension methods:
 * -$z.extend
 * -$z.create
 *
 * Function extensions and chaining:
 * -$z.fn
 *
 * $z.create helper function:
 * -$z.inherits
 *
 * $z.create core inheritors:
 * -$z.functional
 * -$z.constructor
 *
 * $z.create helper inheritors:
 * -$z.Options
 * -$z.InstanceChains
 * -$z.Pop
 *
 * Utility functions
 * -$z.log
 * -$z.dir
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
 * rules: a rule function or property function map
 *
 *
 * Without any rules, $z.extend does a straight merge, but will report an
 * error as soon as there is a property name clash and need for an override.
 * The error made is not thrown, but is a non-critical log message, but this
 * should always be resolved.
 *
 * To resolve property conflicts, either specify a rule function, or a rule map.
 *
 * Rule Functions
 * --------------
 *
 * When a rule function is given, that function is used as the override
 * mechanism for copying properties from the extending object to the host
 * object.
 *
 * A direct rule function is of the form:
 *
 * rule = function(p, q, rules) {
 *   return output;
 * }
 *
 * p: the property value on the host object
 * q: the property value on the extending object
 * rules: the derived rules at this level (used for deep object extension)
 * output: the new value to place on the host object
 *
 * If output is undefined, the property is not written at all.
 * 
 * For example, $z.extend.REPLACE, is the rule function defined by:
 *
 * $z.extend.REPLACE = function(p, q) {
 *   return b;
 * }
 *
 * This will overwrite properties on the host object with properties from
 * the extending object.
 *
 *
 * Rules Specification
 * -------------------
 *
 * It can be more useful to explicitly define how properties should be
 * overrided.
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
 * Provided Rule Functions
 * -----------------------
 *
 * $z.extend provides a number of override functions to use. These are:
 *
 *   $z.extend.REPLACE
 *   -direct replace, by reference for objects and functions
 * 
 *   $z.extend.FILL
 *   -does not replace at all. leaves the existing value.
 *   -This method effectively 'fills in' any properties which aren't already
 *    defined.
 *
 *   $z.extend.DREPLACE (deep replace)
 *   -direct replace for all property types except object
 *   -when a native object is encountered for replacement,
 *    it is in turn recursively replaced onto the object.
 *
 *   $z.extend.DFILL (deep fill)
 *   -analogously, provides property values when not already there, when not an object.
 *   -when an object is provided, it applies the same process to that object as well.
 *
 *   $z.extend.IGNORE
 *   -completely leaves the property out of the extension process
 * 
 *   $z.extend.STR_APPEND
 *   -if both properties are strings, it appends them together
 *
 *   $z.extend.STR_PREPEND
 *   -if both properties are strings, the reverse concatenation of the above
 *   
 *   $z.extend.ARR_APPEND
 *   -if both properties are arrays, they are concatenated
 *   
 *   $z.extend.ARR_PREPEND
 *   -if both properties are arrays, they are reverse concatenated
 *
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
 * 4. Custom extension to allow an array to be extended by a string or array
 *
 *    var a = { names: ['Sue', 'Bob'] };
 *    var b = { names: 'Peter' };
 *    var c = { names: ['Alice'] };
 *
 *
 *    var ARR_STR_APPEND = function(a, b) {
 *      a = a === undefined ? [] : [a];
 *      if (b instanceof Array)
 *        return a.concat(b);
 *      else
 *        return a.push(b);
 *    }
 *
 *    $z.extend(a, b, {
 *      '*': $z.extend.REPLACE,
 *      'invite': ARR_STR_APPEND
 *    });
 *    $z.extend(a, c, {
 *      '*': $z.extend.REPLACE,
 *      'invite': ARR_STR_APPEND
 *    });
 *
 *    returns a = {
 *      invite: ['Sue', 'Bob', 'Peter', 'Alice']
 *    }
 *
 *    This demonstrates the primary use case for $z.extend rules -
 *    the ability to have a flexible object inheritance mechanism.
 *
 *    This is what is provided by $z.create, the next major function.
 * 
 */

var e = $z.extend = function extend(a, b, rule) {
  
  rule = rule || $z.extend.DEFINE;
  
  if (typeof rule == 'function')
    rule = {
      '*': rule
    };
  
  for (var p in b)
    if (!b.hasOwnProperty || b.hasOwnProperty(p)) {
      var out;
      
      try {
        out = (rule[p] || rule['*'])(a[p], b[p], e.deriveRules(rule, p));
      }
      catch (er) {
        $z.dir(a);
        $z.dir(b);
        $z.log('$z.extend: "' + p + '" override error. \n ->' + (er.message || er));
      }
      if (out !== undefined)
        a[p] = out;
    }
  return a;
}

var overrides = [
  function DEFINE(a, b) {
    if (a !== undefined)
      throw 'No override specified.';
    else
      return b;
  },
  function REPLACE(a, b) {
    if (b !== undefined)
      return b;
    else
      return a;
  },
  function FILL(a, b) {
    if (a === undefined)
      return b;
    else
      return a;
  },
  function IGNORE(a, b) {},
  function DREPLACE(a, b) {
    if (b.constructor === Object) {
      if (typeof a === 'undefined')
        a = {};
      return $z.extend(a, b, e.DREPLACE);
    }
    else
      return b;
  },
  function DFILL(a, b) {
    if (b.constructor === Object) {
      if (typeof a === 'undefined')
        a = {};
      return e(a, b, e.DFILL);
    }
    else
      return typeof a === 'undefined' ? b : a;
  },
  function ARR_APPEND(a, b) {
    return (a || []).concat(b);
  },
  function ARR_PREPEND(a, b) {
    return b.concat(a || []);
  },
  function STR_APPEND(a, b) {
    return a ? a + b : b;
  },
  function STR_PREPEND(a, b) {
    return b + a;
  }
];
for (var i = 0; i < overrides.length; i++)
  e[overrides[i].name] = overrides[i];

e.make = function(rule) {
  return function(a, b) {
    return e(a, b, rule);
  }
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
 *     For example, an Event implementor can look out for a special 'event' property object and automatically
 *     register those events on the output object.
 *
 *     eg:
 *     _integrate = function(makeDefinition, createDefinition) {
 *       if (makeDefinition.events)
 *         for (var evt in makeDefinition.events) {
 *           this.events[evt] = this.events[evt] || [];
 *           this.events[evt].push(makeDefinition.events[evt]);
 *         }
 *       return {
 *         events: $z.extend.IGNORE
 *       };
 *     }
 *
 *     makeDefinition: the current definition being implemented
 *     createDefinition: the primary definition in $z.create
 *     'this': is bound to the output object
 *     return value: new rules to apply as part of the $z.extend for the current definition
 *
 *     The rules return value is often needed because we need to ignore the special flags or properties
 *     so they don't get duplicated on the output object. We can't delete the property from the definition
 *     object because definition objects are designed to be immutable in order to be inherited again.
 *
 *
 *   7. _built:
 *
 *     If an inheritor wants to apply some final changes to the object after all the other inheritors
 *     have completed, then a built function can make final modifications.
 *
 *     eg, our event class could run an init event:
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
 * While the Event class has been used as an example above, a different direction has been taken
 * by the author.
 *
 * Instead of a special eventing class, a system of a 'function chaining' extension is provided with
 * $z.fn. This is documented further below.
 *
 * That said, it is very straightforward to put an Event class together together should you wish.
 * 
 */
$z.create = function(inherits, definition) {
  definition = inheritCheck(inherits, definition);
  
  if (definition._definition)
    throw 'You can only implement new definitions. Use the inherits syntax to extend other definitions.';
  
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
  var _integrate = [];
  var _built = [];
  
  implementLoop(definition, function loop(def) {
    
    var integrateRules = null;
    for (var i = 0; i < _integrate.length; i++) {
      var curRule;
      if (curRule = _integrate[i].call(obj, def, definition)) {
        integrateRules = $z.extend(integrateRules || {}, _extend);
        $z.extend(integrateRules, curRule, $z.extend.REPLACE);
      }
    }
    
    if (def._integrate)
      _integrate.push(def._integrate);
    
    $z.extend(obj, def, integrateRules || _extend);
    
    if (def._extend)
      $z.extend(_extend, def._extend);
  
    if (def._make)
      def._make.call(obj, definition, def);
      
    if (def._built)
      _built.push(def._built);
      
    _inherited.push(def);
    
  }, function skip(def) {
    //diamond problem
    // - skip double inheritance by default, lowest inheritor always used
    // - 'reinherit' property can specify to always rerun the inheritance at each repeat
    if (_inherited.indexOf(def) != -1 && !def._reinherit)
      return true;
  });
  
  for (var i = 0; i < _built.length; i++)
    _built[i].call(obj, definition);
  
  delete obj._extend;
  
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
 * $z.functional
 * 
 * 
 * 
 * Function-object make functions
 *
 * Just like $z.constructor, except for functions instead of objects.
 *
 * The function itself that is returned corresponds to running the 'main'
 * function on the prototype.
 *
 * Note prototype inheritance is feigned here, by merely copying the prototype.
 *
 * Usage:
 * var q = $z.create([
 *   $z.functional
 * ], {
 *   construct: function() {
 *     console.log('creating a q functional');
 *   },
 *   prototype: {
 *     main: function(arg) {
 *       console.log('running the q functional instance');
 *     },
 *     method: function() {
 *       console.log('running a method on p!');
 *     }
 *   }
 * });
 * 
 * Then to create an "instance" use:
 * var p = q();
 *
 * Then run the function normally as:
 * p();
 * p.method();
 *
 * This will then execute the 'main' chain.
 *
 * To keep track of the current function scope, a '_this'
 * variable is set on the funtion for each run, and
 * deleted afterwards.
 *
 * This saves having to play with argument splicing.
 *
 */
$z.functional = {
  _extend: {
    'prototype.main': e.CHAIN,
    construct: e.CHAIN,
    prototype: e
  },
  _base: function() {
    function instantiator() {
      function f() {
        // http://www.zestjs.org/docs#functional
        if (!f.main)
          return;
        f._this = this;
        var output = f.main.apply(f, arguments);
        delete f._this;
        return output;
      }
      if (instantiator.prototype)
        $z.extend(f, instantiator.prototype);
      f.constructor = instantiator;
      if (instantiator.construct)
        instantiator.construct.apply(f, arguments);
      return f;
    }
    return instantiator;
  }
};

/*
 * $z.fn
 * Creates function chains under various reduction functions
 * Example:
 *   var f = $z.fn();
 *   f.on(function() { return 'hello world'; });
 *   f.on(function() { console.log('another function'); });
 *   console.log(f());
 *
 * var f = $z.fn($z.fn.LAST_DEFINED);
 *
 * For LAST_DEFINED and STOP_DEFINED, the output of the previous function
 * is added as the last function argument.
 * 
 * var f = $z.fn([startFunc]);
 *
 * NB binding:
 *
 * pass method allows custom scope and arg binding
 * bind method allows for scope fixing
 *
 * var s = $z.fn();
 * s.bind(newThis);
 *
 * s.bind(undefined); //undoes binding to standard func again!
 *   
 * See: http://www.zestjs.org/docs/#fn
 *
 *   $z.extend.CHAIN_AFTER
 *   -when overriding a function with another function, the functions are chained
 *    together to run one after the other
 *   -if the existing property is an instance of $z.fn, it is ammended, otherwise
 *    it is wrapped with the $z.fn functionality before being ammended
 * 
 *   $z.extend.CHAIN_BEFORE
 *   -just as with CHAIN_AFTER but with the reverse execution order
 */

//could possibly allow a second function argument to explicitly
//specify the function to go before or after!
//could also allow function labels for easier debugging

var buildOnce =  function(fn) {
  return function() {
    var output = fn.apply(this, arguments);
    if (output === null)
      return undefined;
    for (var i = 0; i < this.fns.length; i++)
      if (this.fns[i] == func) {
        this.fns.splice(i, 1);
        break;
      }
    return output;
  }
};
var createRunFunction = function(reduce, startVal) {
  return function() {
    var output = startVal;
    var args = Array.prototype.splice.call(arguments, 0);
    var err = null;
    for (var i = 0; i < this.fns.length; i++)
      //try {
        output = reduce(output, this.fns[i].apply(this._this, output === undefined ? args : Array.prototype.concat.call(args, [output])));
      //}
      //catch (e) {
      //  err = e;
      //}
    if (err)
      throw err;
    return output;
  };
}

$z.fn = $z.create({
  _extend: {
    prototype: e
  },
  _base: $z.functional.base,
  construct: function(o, f) {
    this.fns = o instanceof Array ? o : (f ? [f] : []);
    this.run = typeof o == 'function' ? o : $z.fn.LAST_DEFINED;
    this.constructor = $z.fn;
    this.on = this.after;
    this.once = this.onceAfter;
  },
  prototype: {
    main: function() {
      if (this.scope !== undefined)
        this._this = this.scope;
  
      if (this.fns.length == 0)
        return undefined;
      
      var output = this.run.apply(this, arguments);
      
      return output;
    },
    remove: function(fn) {
      if (!fn) {
        this.fns = [];
        return;
      }
      for (var i = 0; i < this.fns.length; i++)
        if (this.fns[i] == fn) {
          this.fns.splice(i, 1);
          return;
        }
    },
    before: function(fn) {
      this.fns = [fn].concat(this.fns);
      return this;
    },
    after: function(fn) {
      this.fns.push(fn);
      return this;
    },
    onceAfter: function(fn) {
      this.after(buildOnce(fn));
    },
    onceBefore: function(fn) {
      this.before(buildOnce(fn));
    },
    pass: function(scope, args) {
      var self = this;
      return function() {
        if (self.fns.length == 0)
          return undefined;
        
        self._this = scope;
        self.main.apply(self, args.concat(Array.prototype.splice.call(arguments, 0)));
        
        return output;
      }
    }
  },
  
  //execution functions
  createRunFunction: createRunFunction,
  LAST_DEFINED: createRunFunction(function(out1, out2) {
    return out2 !== undefined ? out2 : out1;
  }, undefined),
  STOP_DEFINED: function() {
    var args = Array.prototype.splice.call(arguments, 0);
    for (var i = 0; i < this.fns.length; i++) {
      var output = this.fns[i].apply(this._this, Array.prototype.concat.call(args, [output]));
      if (output !== undefined)
        return output;
    }
    return undefined;
  },
  STOP_FIRST_DEFINED: function() {
    var args = Array.prototype.splice.call(arguments, 0);
    if (this.fns[0].apply(this._this, args) !== undefined)
      return;
    for (var i = 1; i < this.fns.length; i++)
      this.fns[i].apply(this._this, args);
  },
  // f.on(function(arg, next) { next() }); f(arg, complete);
  NEXT: function() {
    var args = Array.prototype.splice.call(arguments, 0);
    
    var self = this;
    var i = 0;
    var makeNext = function(i) {
      return function() {
        if (self.fns[i])
          self.fns[i].apply(self._this, args.concat([makeNext(i + 1)]));
      }
    }
    return makeNext(0)();
  },
  AND: createRunFunction(function(out1, out2) {
    return out1 && out2;
  }, true),
  OR: createRunFunction(function(out1, out2) {
    return out1 || out2;
  }, false)
});


e.buildChain = function(f, type) {
  type = type || $z.fn.LAST_DEFINED;
  if (f === undefined)
    f = $z.fn(type);
  if (f.constructor !== $z.fn)
    f = $z.fn(type, f);
  return f;
}
  function CHAIN_AFTER(a, b) {
    a = e.buildChain(a);
    a.after(b);
    return a;
  }
  function CHAIN_BEFORE(a, b) {
    a = e.buildChain(a)
    a.before(b);
    return a;
  }
  e.CHAIN = e.CHAIN_AFTER;

/*
 * $z.on
 *
 * Shorthand for converting any function to a chain
 *
 * Usage:
 *
 * var obj = { sayHi: function() {} }
 * 
 * $z.on(obj, 'sayHi', function() {
 * });
 *
 * Which is identical to:
 * obj.sayHi = $z.fn(obj.sayHi);
 * obj.sayHi.on(function() {
 * });
 *
 */
$z.on = function(obj, name, f) {
  obj[name] = $z.fn([obj[name]]).on(f);
}
$z.remove = function(obj, name, f) {
  if (obj[name].constructor == $z.fn)
    obj[name].remove(f);
}


/*
 * $z.constructor
 *
 * A base definition for $z.implement that allows for javascript prototype construction
 * such that we can create a class that can be instantiated with the new keyword.
 * 
 * Read more about this inheritance model at www.zestjs.org/docs#constructor
 *
 */
$z.constructor = {
  _base: function() {
    function constructor() {
      // http://www.zestjs.com/docs#constructor
      return constructor.construct.apply(this, arguments);
    }
    constructor.construct = $z.fn($z.fn.STOP_FIRST_DEFINED);
    return constructor;
  },
  _extend: {
    prototype: e,
    construct: e.CHAIN
  },
  _integrate: function(def) {
    //the prototype property is skipped if it isn't an enumerable property
    //thus we run the extension manually in this case
    if (Object.getOwnPropertyDescriptor) {
      var p = Object.getOwnPropertyDescriptor(def, 'prototype');
      if (p && !p.enumerable)
        $z.extend(this.prototype, def.prototype, $z.extend.deriveRules(this._extend, 'prototype'));
    }
      
    //allow for working with standard prototypal inheritance as well
    if (typeof def == 'function' && !(def._definition || def.implement || def.base || def.make || def.integrate || def.built))
      return {
        construct: def,
        prototype: def.prototype
      };
  }
};


/*
 * $z.InstanceChains
 * Allows the specification of function chains bound to the instance instead of the prototype
 *
 * Usage:
 * instanceChains: ['click']
 *
 * etc.
 * Array will auto append based on property rules.
 *
 * The instance functions are also automatically bound to this component, so that
 * they become portable beyond the component object (eg for eventing)
 *
 */
$z.InstanceChains = {
  _extend: {
    instanceChains: $z.extend.ARR_APPEND
  },
  _integrate: function(def) {
    this.instanceChains = this.instanceChains || [];
    //any slashed properties on the prototype are added as instance chains automatically
    if (def.prototype) {
      for (var p in def.prototype)
        if (p.substr(0, 2) == '__' && p.substr(p.length - 2, 2) != '__') {
          if (this.instanceChains.indexOf(p.substr(2)) == -1)
            this.instanceChains.push(p.substr(2))
        }
        else if (p.substr(p.length -2, 2) == '__' && p.substr(0, 2) != '__') {
          if (this.instanceChains.indexOf(p.substr(0, p.length - 2)) == -1)
            this.instanceChains.push(p.substr(0, p.length - 2));
        }
    }
    
    for (var i = 0; i < this.instanceChains.length; i++)
      this._extend['prototype.' + this.instanceChains[i]] = $z.extend.CHAIN;
  },
  construct: function() {
    if (this.constructor.instanceChains)
    for (var i = 0; i < this.constructor.instanceChains.length; i++) {
      var instanceFunc = this.constructor.instanceChains[i];
      if (this[instanceFunc] !== undefined)
        this[instanceFunc] = $z.fn([this[instanceFunc]]);
      else
        this[instanceFunc] = $z.fn();
      this[instanceFunc].scope = this;
    }
  }
}

/*
 * $z.Options
 *
 * Provides a 'default options' object on the constructor
 * Options will be added with defaults in the preconstructor
 *
 * An optional 'mixin' option allows for options to be mixed in
 * to the instance on construction completion.
 *
 * $z.constructor({
 *   //default options::
 *   options: {
 *     value: 'test'
 *   },
 *   mixin: true, //opt into instance options mixin
 * });
 *
 */
$z.Options = {
  _extend: {
    'options': $z.extend,
    'options.*': $z.extend.REPLACE,
    'mixin': $z.extend.REPLACE
  },
  options: {},
  _built: function() {
    //allow no argument constructors to have default {} argument
    var constructFunc = this.construct;
    this.construct = function() {
      if (arguments.length == 0)
        constructFunc.apply(this, [{}]);
      else
        constructFunc.apply(this, arguments);
    }
    
    //add mixin if necessary
    //added on built to ensure a complete post-constructor
    //mixin based on the prototype extension rules
    if (this.mixin) {
      var self = this;
      this.construct.on(function(options) {
        $z.extend(this, options, $z.extend.deriveRules(self._extend, 'prototype'));
      });
    }
  },
  construct__: function(options) {
    $z.underwrite(options, this.constructor.options);
  }
};

/*
 * $z.Pop
 * Allows for separating prototype layers
 * Useful when using the debugger to inspect prototype methods in a cleaner way
 *  as you can see the prototype chains
 *
 */
$z.Pop = {
  _make: function() {
    function F(){}
    F.prototype = this.prototype;
    this.prototype = new F();
  }
};

return $z;
}));