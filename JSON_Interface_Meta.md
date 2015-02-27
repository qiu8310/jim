# JIM


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