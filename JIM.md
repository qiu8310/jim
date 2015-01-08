# JSON Interface Meta

## 关于后台接口

后台接口一般需要给很多平台用，比如Web前端、iOS前端、android前端等等，
而每个平台的编码风格（最明显的是驼峰与下划线形式的命名风格）可能都是不一样的，
如果后台提供一个统一风格的编码，那么可能某些平台调用时不符合自己的风格，就得做特殊处理；
一个很好的方法是后台提供一个风格可配置的接口，通过改变接口上的一个参数可以使接口返回指定风格的结果；
另外各个前端在POST数据时，后台接口也可以把这些POST的数据的编码风格转换成其需要的格式，而不用管前端提供给其的格式

JavaScript Demo
```
function walkObject(obj, deep, processFn) {

  if (deep === undefined) {
    deep = true;
  }
  if (_.isString(obj)) {
    return processFn(obj);
  } else {
  
    var result,
      isArray = _.isArray(obj),
      isObject = _.isPlainObject(obj);
      
    if (isArray || isObject) {
      result = isArray ? [] : {};
      _.each(obj, function(val, key) {
        if (isObject) {
          key = processFn(key);
        }
        result[key] = deep && (_.isArray(val) || _.isPlainObject(val)) ?
          walkObject(val, deep, processFn) :
          val;
      });
      return result;
    }
  }
  return obj;
}

_.mixin({camelCase: function(obj, deep) {
  return walkObject(obj, deep, function(str) {
    return str.replace(/_+([a-z])/g, function(_, letter) { return letter.toUpperCase(); });
  });
}});

_.mixin({underscoreCase: function(obj, deep) {
  return walkObject(obj, deep, function(str) {
    // 如果第一个字符是大写的，则不要在它前面加下划线，直接小写就行了
    return str.replace(/[A-Z]/g, function(letter, index) { return (index ? '_' : '') + letter.toLowerCase(); });
  });
}});
```

## 关于接口数据

后台没出数据，前端工作很可能就被 block
前端可以自己 mock 数据，但后台出数据之后返回的命名可能又会变，这时前端又得重新整理接口数据
前端出错，可能真是前端出错，也可能是后台返回的数据错了

想了一种方案，可以在后台 mock 数据，返回指定结构的数据，同时可以验证真实后台数据的格式。

用一个简单易懂的描述性的语言来描述数据结构，比如：
```
struct User {
  age:        <Integer>       range: 0-无穷大
  email:      <Email>         suffix: @liulishuo.com
  gender:     <Gender>          # 性别
  phone:      <Telephone>     regexp: /+86 1\d{10}/
  favFruits:  <Words>         repeat: 1-8             # 后面加了 s ，返回一个数组，数组带有属性  repeat
  registerAt: <Date>          format: 'yyyy-mm-dd HH:ii:ss'
  ext:        <Custom>        [optional] values: a b c 'd d'
}
```

然后指定返回的数据：
```
{
  data: @User.repeat(6, 10)
  status: ok
}
```





jim {
  locale: zh
}

# 会覆盖后台默认的
enum Gender {
  男 0.6  # 0.6 的概率是男
  女
}

#
# Empty => empty string
# Null  => null

# pluralize a word: https://github.com/blakeembrey/pluralize

struct User {
  age:        <Integer>       range: 0-
  email:      <Email>         suffix: @liulishuo.com
  gender:     <Gender>
  phone:      <Telephone>     regexp: /+86 1\d{10}/
  favFruits:  <Words>         repeat: 1-8             # 后面加了 s ，返回一个数组，数组带有属性  repeat
  registerAt: <Date>          format: 'yyyy-mm-dd HH:ii:ss'
  ext:        <Custom>        [optional] values: a b c 'd d'
}


if ( $query == allUser ) {
  0.9 {
    data: @User.repeat(6, 10)  # 这里也可以直接用 @Users ，这样的话会使用默认的 repeat(0, 10)
    status: ok
  }
  or {
    data: @Null
    status: not ok
  }
"example.jim" [noeol] 44L, 991C





```
[
  '{{repeat(5, 7)}}',
  {
    _id: '{{objectId()}}',
    index: '{{index()}}',
    guid: '{{guid()}}',
    isActive: '{{bool()}}',
    balance: '{{floating(1000, 4000, 2, "$0,0.00")}}',
    picture: 'http://placehold.it/32x32',
    age: '{{integer(20, 40)}}',
    eyeColor: '{{random("blue", "brown", "green")}}',
    name: '{{firstName()}} {{surname()}}',
    gender: '{{gender()}}',
    company: '{{company().toUpperCase()}}',
    email: '{{email()}}',
    phone: '+1 {{phone()}}',
    address: '{{integer(100, 999)}} {{street()}}, {{city()}}, {{state()}}, {{integer(100, 10000)}}',
    about: '{{lorem(1, "paragraphs")}}',
    registered: '{{date(new Date(2014, 0, 1), new Date(), "YYYY-MM-ddThh:mm:ss Z")}}',
    latitude: '{{floating(-90.000001, 90)}}',
    longitude: '{{floating(-180.000001, 180)}}',
    tags: [
      '{{repeat(7)}}',
      '{{lorem(1, "words")}}'
    ],
    friends: [
      '{{repeat(3)}}',
      {
        id: '{{index()}}',
        name: '{{firstName()}} {{surname()}}'
      }
    ],
    greeting: function (tags) {
      return 'Hello, ' + this.name + '! You have ' + tags.integer(1, 10) + ' unread messages.';
    },
    favoriteFruit: function (tags) {
      var fruits = ['apple', 'banana', 'strawberry'];
      return fruits[tags.integer(0, fruits.length - 1)];
    }
  }
]
```


## List of template tags
   
### random
   Returns random item from passed arguments list.
   
   Usage
   
   {{random([arg1], [arg2] ... [argN])}}
   Returns
   
   *
   
### repeat
   Specifies number of repeats of array item. Repeatable array must contains only two items: first is repeat tag, second is item that must be repeated. If no arguments is specified item will be repeated from 0 to 10 times. If min argument is specified, item will be repeated that many times. If both arguments are specified, item will be repeated in specified range of times.
   
   Usage
   
   {{repeat([min], [max])}}
   Arguments
   
   Param	Type	Details
   min (optional)	Number	Minimum number in the range. Default is 0.
   max (optional)	Number	Maximum number in the range. Default is 10.
   Returns
   
   Number
   
### index
   Index of current cloned object starting from 0.
   
   Usage
   
   {{index([startFrom])}}
   Arguments
   
   Param	Type	Details
   startFrom (optional)	Number	Index will start from this value. Default is 0.
   Returns
   
   Number
   
### integer
   Random integer in specified range. Can be negative.
   
   Usage
   
   {{integer([min], [max], [format])}}
   Arguments
   
   Param	Type	Details
   min (optional)	Number	Minimum number in the range. Default is 0.
   max (optional)	Number	Maximum number in the range. Default is 10.
   format (optional)	String	Number format. For more info visit Numeral.js.
   Returns
   
   NumberString

### floating
   Random float in specified range. If min argument is float, generated number will be float too with same number of decimals. Can be negative.
   
   Usage
   
   {{floating([min], [max], [fixed], [format])}}
   Arguments
   
   Param	Type	Details
   min (optional)	Number	Minimum number in the range. Default is 0.
   max (optional)	Number	Maximum number in the range. Default is 10.
   fixed (optional)	Number	Number of decimals. Default is 4.
   format (optional)	String	Number format. For more info visit Numeral.js.
   Returns
   
   NumberString

### bool
   Random boolean value.
   
   Usage
   
   {{bool()}}
   Returns
   
   Boolean

### date
   Random date in specified range.
   
   Usage
   
   {{date([min], [max], [format])}}
   Arguments
   
   Param	Type	Details
   min (optional)	Date	Minimum date in the range. Default is new Date(1970, 0, 1).
   max (optional)	Date	Maximum date in the range. Default is new Date().
   format (optional)	String	Date format. For more info visit datef.
   Returns
   
   Number
   
### lorem
   Random Lorem Ipsum text.
   
   Usage
   
   {{lorem([count], [units])}}
   Arguments
   
   Param	Type	Details
   count (optional)	Number	Number of generated units. Default is 1.
   units (optional)	String	Units type. Can be words, sentences, or paragraphs. Default is sentences.
   Returns
   
   String

### objectId [new]
   MongoDB's globally unique identifier for objects.
   
   Usage
   
   {{objectId()}}
   Returns
   
   String

### guid
   Random globally unique identifier.
   
   Usage
   
   {{guid()}}
   Returns
   
   String
   custom function
   You can create your own function, that returns any value. this keyword contains current generated object so you can refer previous existing fields as shown in example.
   
   Usage
   
   function (tags, index) {
     // Your code 
   }
   Arguments
   
   Param	Type	Details
   tags	Object	Object with generation methods which has same names as the tags.
   index	Number	Index of current cloned object starting from 0.
   Returns
   
   *

### firstName
   Random person name of both genders if no gender is specified.
   
   Usage
   
   {{firstName([gender])}}
   Arguments
   
   Param	Type	Details
   gender (optional)	String	Gender of person name. Can be male or female.
   Returns
   
   String

### gender
   Previously generated person gender. Must be after field, that contains firstName tag.
   
   Usage
   
   {{gender()}}
   Returns
   
   String

### surname
   Random person surname.
   
   Usage
   
   {{surname()}}
   Returns
   
   String
   
### company
   Random company name.
   
   Usage
   
   {{company()}}
   Returns
   
   String
   
### email
   Generates email based on firstName, surname and company that are called before of it.
   
   Usage
   
   {{email([random])}}
   Arguments
   
   Param	Type	Details
   random (optional)	Boolean	If true, random email address will be generated. Default is false.
   Returns
   
   String

### phone
   Generates random phone number.
   
   Usage
   
   {{phone([format])}}
   Arguments
   
   Param	Type	Details
   format (optional)	String	Format string which contains x letters. Default is "(xxx) xxx-xxxx".
   Returns
   
   String

### country
   Random country name.
   
   Usage
   
   {{country()}}
   Arguments
   
   Param	Type	Details
   abbreviation (optional)	Boolean	If passed returns country name abbreviation instead of full name.
   Returns
   
   String

### countriesList
   Returns a list of 205 unique countries instead of passed string.
   
   Usage
   
   {{countriesList()}}
   Returns
   
   Array

### state
   Random US state name.
   
   Usage
   
   {{state()}}
   Arguments
   
   Param	Type	Details
   abbreviation (optional)	Boolean	If passed returns state name abbreviation instead of full name.
   Returns
   
   String

### city
   Random US city name.
   
   Usage
   
   {{city()}}
   Returns
   
   String

### street
   Random US street name.
   
   Usage
   
   {{street()}}
   Returns
   
   String








## Reference

* [json generator](http://www.json-generator.com/)
* [mock.js](http://mockjs.com/)
* [regexper](https://github.com/javallone/regexper-static)