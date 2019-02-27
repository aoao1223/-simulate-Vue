class Observer {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            return;
        }
        this.data = data;
        this.init()
    }
    init() {
        Object.keys(this.data).forEach(key => {
            this.observerData(this.data, key, this.data[key])
        })
    }
    observerData(data, key, val) {
        const dep = new Dep()
        new Observer(val)
        Object.defineProperty(data, key, {
            get() {
                if (Dep.target) {
                    // 往dep里面存储watcher实例
                    dep.addListenFunc(Dep.target)
                }
                return val
            },
            set(newValue) {
                if (newValue === val) {
                    return
                }
                val = newValue;
                new Observer(val)
                // 数据的修改，执行订阅函数的触发
                dep.targetFuncs()
            }
        })
    }
}

class Dep {
    constructor() {
        this.listenFuncs = []
    }
    addListenFunc(obj) {
        this.listenFuncs.push(obj)
    }
    // 触发所有的订阅方法
    targetFuncs() {
        this.listenFuncs.forEach(val => {
            val.changeInputValue()
        })
    }
}
Dep.target= null


// 观察者
class Watcher {
    constructor(data, key, cbk) {
        this.data = data;
        this.key = key;
        this.cbk = cbk;
        this.init();
    }
    init() {
        // 把当前的实例绑定到Dep静态方法上
        // 为的触发订阅者
        Dep.target = this;
        // 在取值的过程中把订阅函数存起来
        this.value = utils.getValue(this.data, this.key);
        // 置空静态属性
        Dep.target = null;
        return this.value
    }
    // 订阅者
    changeInputValue() {
        let newValue = this.init()
        this.cbk(newValue)
    }
}

const utils = {
    // 设置指令的内容
    setValue(data, el, attr) {
        let newKey = this.getValue(data, attr.value)
        el.value = newKey;
        new Watcher(data, attr.value, (newVal) => {
            el.value = newVal;
        })
        el.addEventListener('input', (e) => {
            // e.target.val
            this.changeModelValue(data, attr.value, e.target.value)
        })
    },
    changeModelValue(data, key, val) {
        let keys = key.split('.');
        let newData = data;
        for(let i = 0; i < keys.length - 1; i++) {
            newData = newData[keys[i]]
        }
        newData[keys[keys.length - 1]] = val;
    },
    // 设置{{}}的显示内容
    getNodeHtml(data, el, content) {
        let reg = /\{\{(\w+\.?\w+)\}\}/;
        let oldContent = el.textContent;
        content.forEach(val => {
            let contentKey = val.match(reg)[1];
            new Watcher(data, contentKey, () => {
                this.updateTextContent(content, oldContent, el, data)
            })
        })
        this.updateTextContent(content, oldContent, el, data)
    },
    updateTextContent(content, oldContent, el, data) {
        let reg = /\{\{(\w+\.?\w+)\}\}/;
        content.forEach(val => {
            let contentKey = val.match(reg)[1];
            let newValue = this.getValue(data, contentKey);
            oldContent = oldContent.replace(val, newValue)
        })
        el.textContent = oldContent
    },
    // 取数据
    getValue(data, keys) {
        let newKey = keys.split('.');// [res, content]
        let newData = data;
        newKey.forEach(val => {
            newData = newData[val]
        })
        return newData
    }
}





class Mvvm {
    constructor({el, data}) {
        this.el = el;
        this.$data = data;
        this.init();
        this.initDom();
    }
    init() {
        // 获取根元素
        this.$el = document.querySelector(this.el);
        Object.keys(this.$data).forEach(key => {
            // data属性挂载到this实例上
            this.observerData(key)
        });
        // 数据劫持
        new Observer(this.$data)
    }
    initDom() {
        // 加入碎片流
        let newForgment = this.createForgment();
        this.compiler(newForgment);
        document.body.appendChild(newForgment);
    }
    compiler(node) {
        if (node.nodeType === 1) {
            // 获取元素上面的属性
            let attributes = node.attributes;
            Array.from(attributes).forEach(attr => {
                if(attr.nodeName.indexOf('v-') > -1) {
                    utils.setValue(this.$data, node, attr)
                }
            })
        } else if (node.nodeType === 3) {
            let reg = /\{\{\w+\.?\w+\}\}/g;
            if (reg.test(node.textContent)) {
                utils.getNodeHtml(this.$data, node, node.textContent.match(reg))
            }
        }
        // 有子元素的继续判断
        if (node.childNodes && node.childNodes.length > 0) {
            Array.from(node.childNodes).forEach(childNode => {
                this.compiler(childNode)
            })
        }

    }
    createForgment() {
        let newForgment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = this.$el.firstChild) {
            newForgment.appendChild(firstChild)
        }
        return newForgment;
    }
    observerData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newValue) {
                this.$data[key] = newValue;
            }
        })
    }
}










