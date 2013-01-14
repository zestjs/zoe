zoe.js
======

Natural JavaScript inheritance.

For comprehensive documentation see [http://zoejs.org/docs].

Runs in NodeJS, AMD and as a browser global.

Usage Examples
---

### Static Class

```javascript
  var ModelClassDefinition = {
    // specify the class extension rules
    _extend: {
      items: 'ARR_APPEND',
      addItem: 'CHAIN'
    },

    // class properties just object properties
    items: ['initial data item'],
    loadData: function() {
      this.data = [1, 4, 5];
    },
    addItem: function(item) {
      this.data.push(item);
    }
  };

  // creating the class extends each implemented class definition onto a new object, using the extension rules
  var myModel = zoe.create([ModelClassDefinition], {
    // 'items' gets array-appended, causing the item list to be generated
    // 'addItem' function gets chained, causing the functions to run one after the other
    items: ['extra initial data'],
    addItem: function(item) {
      console.log('added item ' + item);
    }
  });
  myModel.loadData();
  myModel.addItem(10); // "added item 10"
  console.log(myModel.items); // "['initial data item', 'extra initial data']"
```

### Extending a Static Class

```javascript
  var newModel = zoe.create([ModelClassDefinition], {
    // a double underscore notation can allow for setting extension rules in the property name itself
    // here, 'addItem' is replaced by the new function, and the 'items' array is prepended.
    __addItem__: function(item) {
      console.log('replaced add item method entirely');
    },
    items__: ['very first data item']
  });
  newModel.loadData();
  newModel.addItem(10); // "replaced add item method entirely"
  console.log(newModel.items); // "['very first data item', 'initial data item']"
```

### Prototype Classes

```javascript
  // zoe.Constructor is an implementor providing extension rules for standard prototypal inheritance
  var Ball = zoe.create([zoe.Constructor], {
    _extend: {
      'prototype.setColor': 'CHAIN'
    },
    construct: function(color) {
      this.color = color || 'blue';
    },
    prototype: {
      setColor: function(color) {
        this.color = color;
      },
      getColor: function() {
        return this.color;
      }
    }
  });

  // the class instance is now the Object Constructor to be instantiated
  var myBall = new Ball('yellow');
  myBall.getColor(); // yellow
```

### Multiple Prototypal Extension
```javascript
  var BouncingBall = zoe.create([Ball], {
    // the prototype and constructor are extended naturally by default by zoe.Constructor
    construct: function(color) {
      this.bouncing = false;
    },
    prototype: {
      setColor: function(color) {
        console.log('the ' + (this.bouncing ? 'bouncing' : 'stationary') + ' ball is now ' + color);
      },
      bounce: function() {
        this.bouncing = true;
        console.log('bouncing');
      },
      stop: function() {
        this.bouncing = false;
        console.log('not bouncing');
      }
    }
  });

  var myBall = new BouncingBall('green');
  myBall.bounce(); // "bouncing"
  myBall.setColor('red'); // "the bouncing ball is now red"
```

### Eventing

```javascript
  // chains also provide an eventing paradigm, when implementing 'zoe.InstanceChains'
  var EventedBall = zoe.create([Ball, zoe.InstanceChains]);

  var myBall = new EventedBall('blue');
  myBall.setColor.on(function(color) {
    console.log('set color event hook: color is now ' + this.color);
  });
  myBall.setColor('red'); // "set color event hook: color is now red"
```

### Custom Extension Logic

Custom extension definition hooks allow dynamic extension control:

```javascript
  var MyImplementor = {
    _extend: {
      customProperty: 'STR_PREPEND'
    },
    _make: function() {
      this.customProperty = ' created at ' + new Date();
    }
  };


  var Test = zoe.create([MyImplementor], {
    customProperty: 'Test class'
  });
  console.log(Test.customProperty); // "Test class created at Mon Jan 14 2013 14:35:08 GMT+0200 (SAST)
```
