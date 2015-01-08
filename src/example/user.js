var JIM = require('../jim');

JIM.struct('User', {
  id: '@Id',
  _id: '@ObjectId',
  guid: '@Guid',
  str1: '@String(length: 20).cap(something)',
  str2: 'AAA{@String.lower}BBB',
  str3: '@String(pools: mora)',
  firstName: {
    type: 'FirstName',
    options: {
      gender: '@Self.gender'
    }
  },
  lastName: '@LastName',
  userName: '@Self.firstName @MiddleName @Self.lastName',
  notExistDepend: '@Self.notExist',
  age: {
    type: 'Int',
    options: {
      min: 10,
      max: 80
    }
  },
  random: [1, 2, 3, 4, 5],
  gender: '@Gender',
  likesCopy: '@Self.likes',
  likes: {
    type: 'String',
    options: {
      pools: 'abcdef',
      min: 5,
      max: 10
    },
    processes: {
      cap: true,
      repeat: true
    }

  }
});




/*
// examples:
console.log({
  custom: Types.ObjectId().repeat().result(),
  bools: Types.Boolean().repeat(3, 4).result(),
  int: Types.Int().result(),
  chars: Types.Char().title().repeat(6).result(),
  gender: Types.Gender({lang: 'en'}).result(),
  status: 'ok'
});


JIM.struct('User', {
  id: '@Id',
  _id: '@ObjectId',
  guid: '@Guid',
  str1: '@String(length: 20).cap(something)',
  str2: 'AAA{@String.lower}BBB',
  str3: '@String(pools: mora)',
  firstName: {
    type: 'FirstName',
    options: {
      gender: '@Self.gender'
    }
  },
  lastName: '@LastName',
  userName: '@Self.firstName @MiddleName @Self.lastName',
  notExistDepend: '@Self.notExist',
  age: {
    type: 'Int',
    options: {
      min: 10,
      max: 80
    }
  },
  random: [1, 2, 3, 4, 5],
  gender: '@Gender',
  likesCopy: '@Self.likes',
  likes: {
    type: 'String',
    options: {
      pools: 'abcdef',
      min: 5,
      max: 10
    },
    processes: {
      cap: true,
      repeat: true
    }

  }
});


console.log(Types.User().repeat(1).result());

 */


