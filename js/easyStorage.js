/*!
 * easyStorage 0.5 (experimental)
 * (c) 2020 Richard Franklin Chinedu
 */

class EasyStorage{
    constructor(database){
        this.init(database);
        this.createEventSpace();
        window.addEventListener('storage', (e) => {
            if(e.key == '__$easyStorage'){
                this.updateEasystorage();
                Object.keys(this.dbEvents[this.db.name]['events']['tabupdate'].values).forEach((el) => {
                    this.dbEvents[this.db.name]['events']['tabupdate'].values[el].callback();
                }, this);
            }
        });
    }
    init(database){
        if(! localStorage.__$easyStorage ){
            localStorage.__$easyStorage = JSON.stringify({
                databaseHolder : {
                    [database] :  {
                        name : database,
                        tables : {}
                    }
                },
            });
            this.__$easyStorage = JSON.parse(localStorage.__$easyStorage);
            this.db = this.__$easyStorage.databaseHolder[database];
            this.addMethods();
        } else {
            this.__$easyStorage = JSON.parse(localStorage.__$easyStorage);
            if(this.__$easyStorage.databaseHolder[database]){
                this.db = this.__$easyStorage.databaseHolder[database];
                this.addMethods();
            } else {
                this.__$easyStorage.databaseHolder[database] = {
                    name : database,
                    tables : {}
                },
                localStorage.__$easyStorage = JSON.stringify(this.__$easyStorage);
                this.db = this.__$easyStorage.databaseHolder[database];
                this.addMethods();
            }
        }
    }
    createEventSpace(){
        this.dbEvents = {
            [this.db.name] : {
                events : {
                    tabupdate : {
                        lastInsertId : 0,
                        values : {}
                    }
                }
            }
        }
    }
    addMethods(){
        let that = this;
        Object.defineProperty(Object.prototype, 'getAll', {
            configurable : true,
            value : function(){
                let tablename = this['tablename'];
                return tablename ? this : that.db['tables'];
            }
        });
        Object.defineProperty(Object.prototype, 'getFirst', {
            configurable : true,
            value : function(){
                let tablename = this['tablename'];
                return tablename ? this[0] : that.db['tables'];
            }
        });
        Object.defineProperty(Object.prototype, 'getLast', {
            configurable : true,
            value : function(){
            let tablename = this['tablename'];
            let len = this.length;
             return tablename ? this[len - 1] : that.db['tables'];
            }
        });
        Object.defineProperty(Object.prototype, 'batch', {
            configurable : true,
            value : function(start, stop){
                let tablename = this['tablename'];
                return tablename ? this.slice(start, stop) : that.db['tables'];
            }
        });
        Object.defineProperty(Object.prototype, 'from', {
            configurable : true,
            value : function(tablename){
                let selectFrom = JSON.parse(this.selectFrom);
                let result = that.db['tables'][tablename]['records'].map((el, i) => {
                    let resObj = {};
                    if(selectFrom != '*'){
                        selectFrom.forEach((item) => {
                            if(item in el){
                                resObj[item] = el[item];
                            }
                        });
                    } else {
                        resObj = el;
                    }
                    return resObj;
                });
                result = that.removeFalsy(result);
                that.addProperties([
                        {
                            target : result,
                            key : 'tablename',
                            value :  tablename,
                        },
                        {
                            target : result,
                            key : 'selectFrom',
                            value :  this['selectFrom'],
                        },
                        {
                            target : result,
                            key : 'type',
                            value :  this['type'],
                        },
                    ]);
                return result;
            }
        })
        Object.defineProperty(Object.prototype, 'like', {
            configurable : true,
            value : function (value, isInclude){
                let tablename = this['tablename'];
                let expression = JSON.parse(this['expression']);
                let type = this['type'];
                let likeValue = value;
                let isDelete = type == 'delete' ? true : false;
                if(expression in that.db['tables'][tablename]['fields']){
                    if( ! value) throw new Error(`argument for like cant be empty`);
                    let valIndex = value.indexOf('%');
                    let isExact = (value.indexOf('%') != value.lastIndexOf('%') && value.length - 1 == value.lastIndexOf('%')) || value.indexOf('%') == -1;
                    let realVal = value.replace(/%/ig, '');
                    let keyword = isInclude ? 'includes' : (valIndex == 0 ? 'startsWith' : 'endsWith');
                    let result;
                    if(isExact && !isInclude){
                        result = that.db['tables'][tablename]['records'].filter((el, i) => {
                            let passed = (el[expression] == realVal);
                            (isDelete && passed) && that.db['tables'][tablename]['records'].splice(i, 1, false);
                            return passed;
                        })
                        that.db['tables'][tablename]['records'] = that.removeFalsy(result);
                        that.updateLocalStorage(type);
                    } else {
                        let tableValue = that.db['tables'][tablename]['records'];
                        result = that.db['tables'][tablename]['records'].filter((el, i) => {
                            let passed = String(el[expression])[keyword](realVal);
                            (isDelete && passed) && that.db['tables'][tablename]['records'].splice(i, 1, false);
                            return passed;
                        });
                        that.db['tables'][tablename]['records'] = that.removeFalsy(tableValue);
                        that.updateLocalStorage(type);
                    }
                    that.addProperties([
                        {
                            target : result,
                            key : 'tablename',
                            value :  tablename,
                        },
                        {
                            target : result,
                            key : 'type',
                            value :  type,
                        },
                        {
                            target : result,
                            key : 'likeValue',
                            value :  likeValue,
                        },
                        {
                            target : result,
                            key : 'expression',
                            value :  JSON.stringify(expression),
                        },
                        {
                            target : result,
                            key : 'like',
                            value :  true,
                        },
                    ]);
                    return result;
                }  else {
                    let tableValue = that.db['tables'][tablename]['records'];
                    let columnArr = expression.split(' ');
                    let column = columnArr[0];
                    let operator = columnArr[1];
                    operator = operator == '=' ? '==' : operator;
                    operator = operator == '>' ? '<' : (operator == '<' ? '>' : operator);
                    let operand = columnArr[2];
                    let result = that.db['tables'][tablename]['records'].filter((el, i) => {

                        let passed = eval(operand + " " + operator + " " + el[column]);

                        (isDelete && passed) && that.db['tables'][tablename]['records'].splice(i, 1, false);
                        return passed;
                    });
                    that.db['tables'][tablename]['records'] = that.removeFalsy(tableValue);
                    that.updateLocalStorage(type);

                    that.addProperties([
                        {
                            target : result,
                            key : 'tablename',
                            value :  tablename,
                        },
                        {
                            target : result,
                            key : 'type',
                            value :  type,
                        },
                        {
                            target : result,
                            key : 'likeValue',
                            value :  likeValue,
                        },
                        {
                            target : result,
                            key : 'expression',
                            value :  JSON.stringify(expression),
                        },
                        {
                            target : result,
                            key : 'like',
                            value :  true,
                        },
                    ])
                    return result;
                }
            }
        });
        Object.defineProperty(Array.prototype, 'values', {
            configurable : true,
            value : function(obj){
                let tablename = this['tablename'];
                let expressionArr = this.expression ? JSON.parse(this['expression']) : [];
                let like = this['like'];
                let likeValue = this['likeValue'];
                let type = this['type'];
                let expressObj = (that.expressionObject(that.formatExpression(expressionArr)));
                if( !likeValue ){
                    return that.db['tables'][tablename]['records'].forEach((el) => {
                        if(eval(el[expressObj.firstOperand] + " " + expressObj.operator + " " + expressObj.secondOperand)){
                           
                            Object.keys(obj).forEach((userEl) => {
                                el[userEl] = obj[userEl];
                                that.updateLocalStorage(type);
                            },that)
                        }
                    });
                } else {
                    if( ! likeValue) throw new Error(`argument for like cant be empty`);
                    let valIndex = likeValue.indexOf('%');
                    let isExact = (likeValue.indexOf('%') != likeValue.lastIndexOf('%') && likeValue.length - 1 == likeValue.lastIndexOf('%')) || likeValue.indexOf('%') == -1;
                    let realVal = likeValue.replace(/%/ig, '');
                    let keyword = valIndex == 0 ? 'startsWith' : 'endsWith';
                    if(isExact){
                        that.db['tables'][tablename]['records'].forEach((el) => {
                            if(eval(expressObj.secondOperand + " " + expressObj.operator + " " + el[expressObj.firstOperand])){
                                Object.keys(obj).forEach((userEl) => {
                                    el[userEl] = obj[userEl];
                                    that.updateLocalStorage(type);

                                },that)
                            }
                        })
                    } else {
                        that.db['tables'][tablename]['records'].forEach((el) => {
                            if(String(el[expressionArr])[keyword](realVal)){
                                Object.keys(obj).forEach((userEl) => {
                                    el[userEl] = obj[userEl];
                                    that.updateLocalStorage(type);

                                },that)
                            }
                        })
                    }
                }
            }
        });
        Object.defineProperty(Object.prototype, 'all', {
            configurable : true,
            value : function(){
                let tablename = this['tablename'];
                let type = this['type'];
                if(type == 'delete'){
                    that.db['tables'][tablename]['records'] = [];
                    if(!that.db['tables'][tablename]['records'].length){
                        that.updateLocalStorage('delete');
                        return true;
                    } 
                }
            }
        });
        Object.defineProperty(Object.prototype, 'where', {
            configurable : true,
            value : function (expressionArr){
                let tablename = this['tablename'];
                let type = this['type'];
                let selectFrom = this.selectFrom ? JSON.parse(this.selectFrom) : false;
                let expression = that.typeOf(expressionArr) == 'Array' ? JSON.stringify(expressionArr) : JSON.stringify([expressionArr]);
                if(expressionArr in that.db['tables'][tablename]['fields']){
                    let tablename = this['tablename'];
                    let where = that.db['tables'][tablename]['records'];
                    that.addProperties([
                        {
                            target : where,
                            key : 'expression',
                            value : expression
                        },
                        {
                            target : where,
                            key : 'tablename',
                            value : tablename
                        },
                        {
                            target : where,
                            key : 'type',
                            value : type
                        }
                    ]);
                    return where;
                } else {
                    let expressObj = (that.expressionObject(that.formatExpression(expressionArr)));
                    let tableValue = that.db['tables'][tablename]['records'];
                    let result = that.db['tables'][tablename]['records'].map((el, i) => {
                    let e1 = JSON.stringify(el[expressObj.firstOperand]);
                    let e2 = JSON.stringify(expressObj.secondOperand);
                    let expressionStr = (`${e1} ${expressObj.operator} ${e2}`);
                        let passed = eval(expressionStr.toString());
                        let resObj = {};
                        if(passed){
                            (type == 'delete') && that.db['tables'][tablename]['records'].splice(i, 1, false);
                            if(selectFrom && (selectFrom != '*')){
                                selectFrom.forEach((item) => {
                                    if(item in el){
                                        resObj[item] = el[item];
                                    }
                                });
                            } else {
                                resObj = el;
                            }
                        }
                        return resObj;
                    });
                    that.db['tables'][tablename]['records'] = that.removeFalsy(tableValue);
                    that.updateLocalStorage(type);

                    result = that.removeFalsy(result);
                    // let properties = ;
                   that.addProperties([
                        {
                            target : result,
                            key : 'expression',
                            value : expression
                        },
                        {
                            target : result,
                            key : 'tablename',
                            value : tablename
                        },
                        {
                            target : result,
                            key : 'type',
                            value : type
                        }
                    ]);
                    return result;
                }
            },
        })
    }
    expressionObject(expressionArr){
        return {
            firstOperand : expressionArr[0],
            operator : expressionArr[1],
            secondOperand : expressionArr[2],
        }
    }
    tableExist(tablename){
        return this.db['tables'][tablename] ? true : false;
    }
    dropTable(tablename){
        delete this.db['tables'][tablename];
        that.updateLocalStorage('delete');

    }
    formatExpression(expressionArr){
       return expressionArr.map((el) => {
           if(el == '='){
               return el = '==';
           } else {
               return el;
           }
        });
    }
    getLastInsertId(tablename){
       let field = this.db['tables'][tablename]['fields'];
       for(let record in field){
           if(field[record].key){
               return field[record].lastInsertId
           }
       }
    }
    create(tablename, fields){
        this.db['tables'][tablename] = {
            'records' : []
        };
        this.db['tables'][tablename]['fields'] = this.typeOf(fields) == 'Array' ? this.validateField(this.ArrayColumnObject(fields)) : this.validateField(fields);
        this.updateLocalStorage('create');
    };
    insert(tablename, records){
        if(!tablename){
            throw new Error('Invalid Tablename');
        } else if(! this.db['tables'][tablename]){
            throw new Error(`Inserting into ${tablename} failed. Reason : Table does not exist`);
        }
        this.db['tables'][tablename]['records'].push(this.ArrayToRecordObject(tablename, records));
        this.updateLocalStorage('insert');
        return this.addProperties([
            {
                target : {},
                key : 'lastInsertId',
                value : this.getLastInsertId(tablename)
            },
        ])[0];
    }
    convertToObj(arr){
        let obj = {};
        arr.forEach((el) => {
            obj[el] = '';
        });
    }
    ArrayToRecordObject(tablename, records){
        let obj = {};
        if(this.typeOf(records) == 'Array'){
            let recordsLen = records.length;
            let fieldsLen = Object.keys(this.db['tables'][tablename]['fields']).length;
            if(recordsLen == (fieldsLen - 1)){
                records = [1, ...records];
            }
            Object.keys(this.db['tables'][tablename]['fields']).forEach((element, i) => {
                let currentEl = this.db['tables'][tablename]['fields'][element];
                if(currentEl.key){
                    currentEl.lastInsertId = currentEl.lastInsertId ? (currentEl.lastInsertId + 1) : 1;
                    obj[element] = currentEl.lastInsertId;
                } else {
                    obj[element] = (records[i] >= 0 || records[i]) ? records[i] : (currentEl.default ? currentEl.default : null)
                }
            });
            this.validateType(tablename, obj);
            return obj;
        } else {
            let recordsLen = Object.keys(records).length;
            let fieldsLen = Object.keys(this.db['tables'][tablename]['fields']).length;
            if(recordsLen == (fieldsLen - 1)){
                records = { id : 1, ...records};
            }
            Object.keys(this.db['tables'][tablename]['fields']).forEach((element, i) => {
                let currentEl = this.db['tables'][tablename]['fields'][element];
                if(currentEl.key){
                    currentEl.lastInsertId = currentEl.lastInsertId ? (currentEl.lastInsertId + 1) : 1;
                    obj[element] = currentEl.lastInsertId;
                } else {
                    obj[element] = (records[element] >= 0 || records[element]) ? records[element] : (currentEl.default ? currentEl.default : null);
                }
            });
            this.validateType(tablename, obj);
            return obj;
        }
    }
    isEmptyArray(arr){
        return arr.every((el) => {
            return !el;
        })
    }
    removeFalsy(arr){
        return arr.filter((el) => {
            return Object.keys(el).length && el;
        });
    }
    validateType(tablename, records){
        return Object.keys(this.db['tables'][tablename]['fields']).forEach((key, i) => {
            let type = this.db['tables'][tablename]['fields'][key].type;
            if((records[key] &&  (type != this.typeOf(records[key])))){
                throw new Error(`cant insert ${this.typeOf(records[key])} into ${key} with type : ${type}`)
            }
        });
    }
    validateField(fields){
        for(let field in fields){
            if(! ('type' in fields[field])){
                throw new Error(`type not specified for column : ${field}`);
            }
        }
        return fields;
    }
    typeOf(input){
        return input ? (input).constructor.name : null;
    }
    ArrayColumnObject(arr){
        let type = this.typeOf(arr);
        let obj = {};
        arr.forEach(element => {
            obj[element] = '';
        });
        return obj;
    }
    updateEasystorage(){
        let __$easyStorage = JSON.stringify(this.__$easyStorage);
        let storage = localStorage.__$easyStorage; 
        if( ! (__$easyStorage == storage) ){
            this.init(this.db.name);
        }
    };
    updateLocalStorage(type){
        let __$easyStorage = JSON.stringify(this.__$easyStorage);
        try {
            localStorage.__$easyStorage = __$easyStorage;
        } catch(e){
            throw new Error(e.message);
        }
    };
    getFromLocalStorage(db){
        return JSON.parse(localStorage.__$easyStorage.databaseHolder[database]);
    }
    createTrack(tablename, type){
        if(!tablename){
            throw new Error('Invalid Tablename');
        } else if(! this.db['tables'][tablename]){
            throw new Error(`update to ${tablename} failed. Reason : Table does not exist`);
        }
        let holder = this.db['tables'][tablename]['records'];
        let properties = [
            {
                target : holder,
                key : 'tablename',
                value : tablename,
            },
            {
                target : holder,
                key : 'type',
                value : type,
            }
        ];
        return this.addProperties(properties)[properties.length - 1];
    }
    createColumnTrack(column, type){
        let holder = [];
        let properties = [
            {
                target : holder,
                key : 'type',
                value : type,
            },
            {
                target : holder,
                key : 'selectFrom',
                value : column,
            }
        ];
        return this.addProperties(properties)[properties.length - 1];
    }
    select(column){
        column = this.typeOf(column) == 'String' ? [column] : column;
        return this.createColumnTrack(JSON.stringify(column), 'select');
    }
    update(tablename){
        return this.createTrack(tablename, 'update');
    }
    delete(tablename){
        return this.createTrack(tablename, 'delete');
    }
    
    addProperties(properties){
       return properties.map((property) => {
            let target = property.target;
            let key = property.key;
            let value = property.value;
            // key == 'type' ? true : false
            Object.defineProperty(target, key, {
                enumerable : false,
                configurable : true,
                writable : false,
                value : value
            });
            return target;
        });
    }
    on(event, callback, thisValue){
      this.addEventListener(event, callback, thisValue);
    }
    addEventListener(event, callback, thisValue){
        if(this.dbEvents[this.db.name]['events'][event]){
            this.dbEvents[this.db.name]['events'][event].lastInsertId += 1;
            this.dbEvents[this.db.name]['events'][event].values['event' + this.dbEvents[this.db.name]['events'][event].lastInsertId] = {
                'callback' : thisValue ? callback.bind(thisValue) : callback,
            };
            return this.dbEvents[this.db.name]['events'][event].lastInsertId;
        }
    }
    removeEventListener(event, eventId, callback, thisValue){
        if(eventId){
            let eventKey = 'event' + eventId;
            if(this.dbEvents[this.db.name]['events'][event].values[eventKey]){
                delete this.dbEvents[this.db.name]['events'][event].values[eventKey];
                return callback ? (thisValue ? callback.bind(thisValue)() : callback()) : true;
            }
            return false;
        }
        return null;
    }
}