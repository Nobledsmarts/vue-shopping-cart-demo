const adminView = {
    data(){
        return {
            products : [],
            addNew : false,
            isEdit : false,
            newProductname : null,
            newProductquantity : 1,
            newProductstock : 1,
            newProductimage : "",
            newProductprice : 0,
            currentEditId : "",
            currentEditPid : "",
            searchInput : "",
            isSearch : false,
            isLoading : false
        }
    },
    created(){
        document.title = "simple shopping - Admin";
        this.currentPage = Object.keys(this.$route.query).length ? this.$route.query.page : 1;
        this.setProducts();
        db.addEventListener('tabupdate', () => {
            this.$store.commit('updateStore');
            this.setProducts();
        });
    },
    watch :{
        searchInput() {
           this.searchProduct();
        },
        '$route'(route){
            this.currentPage = route.query.page ? route.query.page : 1;
            this.setProducts();
        }
    },
    computed : {
        ...Vuex.mapGetters({
            getProducts : 'getProducts',
            getProduct : 'getProduct',
            cart : 'cart',
            getModalMsg : 'modalMsg'
        }),
    },
    methods : {
        setProducts(){
            this.products = this.filter([... this.getProducts.reverse()]);
            this.getProducts.reverse();
        },
        searchProduct(){
            event.preventDefault();
            if(this.searchInput){
                this.isSearch = true;
                let products = db.select(['*']).from(['products']).where('name').like(this.searchInput, true);
                this.products = this.filter([... products.reverse()]);

            } else {
                this.isSearch = false;
                this.setProducts();
            }
        },
        outOfStock(productIndex){
            return this.products[productIndex].stock > 0 ? false : true;
        },
    
        dismissModal(){
            this.$store.dispatch('dismissModal', {
                vm : this.$root
            });
        },
        showModal(modalMsg){
            this.$store.dispatch('showModal', {
                modalMsg,
                vm : this.$root
            });
        },
        editProduct(){
            event.preventDefault();
            if(! this.newProductname){
                this.showModal('product name cant be empty')
                return;
            }
            db.update('products').where(['id', '=',  this.currentEditId]).values({
                name : this.newProductname,
                quantity : this.newProductquantity,
                stock : this.newProductstock,
                price : this.newProductprice,
                image : this.newProductimage
            });

            this.$store.commit('updateStore');
            this.showModal('Product Edited');
        },
        cancelAdd(){
            if(this.isEdit){
                this.isEdit = false;
                this.addNew = false;
                this.resetData();
            } else {
                this.addNew = false;
            }
        },
        triggerEdit(){
            this.addNew = true;
            this.isEdit = true;
            let productId = event.currentTarget.dataset.pid;
            let productIndex = event.currentTarget.dataset.id;
            this.currentEditId = productId;
            this.currentEditPid = productIndex;

            this.newProductname = this.products[productIndex].name;
            this.newProductquantity = this.products[productIndex].quantity;
            this.newProductstock = this.products[productIndex].stock;
            this.newProductimage = this.products[productIndex].image;
            this.newProductprice = this.products[productIndex].price;
        },
        triggerAddNew(){
            this.addNew = true;
        },
        triggerRemoveAll(){
            let msg = "remove all products?";
            this.triggerRemove(msg, true);
        },
        triggerRemove(msg, isRemoveAll){
            window._that = this;
            let productId = event.currentTarget.dataset.pid;
            this.showModal(`
                ${isRemoveAll ?  msg : 'Do you want to remove this product?'}
                <div class="modal-cta" align="center">
                    <button onclick="adminView.methods${isRemoveAll ? ".removeAll" : ".removeProduct"}(${productId});" class="btn">
                        remove
                    </button> 
                    <button onclick="adminView.methods.triggerCancel()" class="btn"> cancel </button>
                </div> 
            `);
        },
        storeProduct(event){
            event.preventDefault();
            if(this.isEdit){
                this.editProduct();
            } else {
                let hasEmptyField = !this.newProductname || !this.newProductquantity || !this.newProductimage || !this.newProductstock;

                if( hasEmptyField ){
                    this.showModal('fields cant be empty')
                    return;
                }
                if( this.newProductquantity < 0 ){
                    this.showModal('stock cant be empty')
                    return;
                }
                try{
                    let insert = db.insert('products', {
                        name : this.newProductname,
                        stock : Number(this.newProductstock),
                        price : Number(this.newProductprice),
                        quantity : Number(this.newProductquantity),
                        image : this.newProductimage,
                    });
                    this.$store.commit('updateStore');
                    this.showModal('Product added');
                    this.setProducts();
                    this.resetData();
                } catch(e){
                    this.showModal('Uploading failed : ' + e.message);
                }
            }
        },
        resetData(){
            this.currentEditId = '';
            this.currentEditPid = '';
            this.newProductname = '';
            this.newProductstock = 1;
            this.newProductimage = '';
            this.$refs.productFile.value = "";
            this.newProductprice = 0;
        },
        setImagePath(){
            this.isLoading = true;
            const file = event.currentTarget.files[0];
            const reader = new FileReader();
            const REDUCE_RATIO = 0.1;
            let that = this;
            reader.addEventListener('load', (event) => {
                const image = new Image();
                image.src = event.target.result;
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    ctx.canvas.toBlob((blob) => {
                        const newFile = new File([blob], file.name, {
                            type : 'image/jpeg',
                            lastModified : Date.now(),
                        });
                        const reader2 = new FileReader();
                        reader2.readAsDataURL(newFile);
                        reader2.addEventListener('loadend', (e) => {
                            const newFileSrc = e.target.result;
                            that.newProductimage = newFileSrc;
                            that.isLoading = false;
                        });
                    }, 'image/jpeg', REDUCE_RATIO);
                });
            });
            reader.readAsDataURL(file);
        },
        removeAll(){
            this.removeProduct(false, true)
        },
        removeProduct(productId, isRemoveAll){
            let that = window._that;
            that.dismissModal();
            if( !isRemoveAll ){
                db.delete('products').where(['id', '=',  productId]);
                db.delete('cart').where(['productId', '=', productId]);
                that.showModal('product has been deleted');
            } else {
                let del = db.delete('products').all();
                // db.delete('products').all();
                del && db.delete('cart').all() && that.showModal('products has been deleted');
            }
            that.$store.commit('updateStore');
            that.setProducts();
            window._that = undefined;
        },
        triggerCancel(){
            let that = window._that;
            that.dismissModal();
            window._that = undefined;
        },
    },
    template : `
            <section class="main-content" v-if="(!addNew)">
            <div class="search-panel">
                <div class="search-panel-inner" style="display: flex; flex-wrap: wrap">
                        <h3> products - ({{getProducts.length}})</h3>
                    <div class="panel-cta-btn-cont"> 
                        <div class="content-center">
                            <button class="btn" v-on:click="triggerAddNew">
                                Add new
                            </button>
                        </div> 
                        <div v-if="getProducts.length > 1" class="content-center">
                            <button class="btn btn-remove" v-on:click="triggerRemoveAll">
                                remove all
                            </button>
                        </div>  
                    </div>
                </div>
                <div class="form-div">
                    <form>
                        <input type="text" placeholder="search products" v-model="searchInput">
                        <input type="submit" value="search">
                    </form>
                </div>
            </div>
            <div v-if="products.length" class="products-cont" align="center">
                <div v-for="(product, i) in products" class="product-item">
                <div class="product-img" :style="'background-image:url(' + product.image + ')'">
                    <div align="right" class="row-pad">
                        <div class="stock-cont" title="stock" align="right">
                            {{product.stock}}
                        </div>
                    </div>
                </div>
                <div class="row-pad">
                    <strong> {{product.name}} </strong>
                </div>
                <div class="row-pad" align="center">
                    <span> price -  {{product.price == 0 ? 'free' : '$' + product.price}} </span>
                </div>
                    <br>
                <div class="row-pad">
                    <button class="btn cart-btn" v-on:click="triggerRemove" v-bind:data-pid="product.id" v-bind:data-id="i">
                        remove 
                    </button>
                    <button class="btn cart-btn" v-on:click="triggerEdit" v-bind:data-pid="product.id" v-bind:data-id="i">
                        edit 
                    </button>
                </div>
            </div>
            </div>
            <div v-else class="content-center" align="center" style="min-height:50vh">
                {{isSearch ? 'No Item Found' : 'No Products Yet'}}
            </div>
            <div style="padding: 0px 30px; flex-direction:row; display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; border-radius: 5px;">
                <div class="w-100">
                    <ul v-if="pages('getProducts').length" class="pagination">
                        <li v-for="i in pages('getProducts')"  class="pagination-item">
                            <router-link :to="'?page=' + i" tag="a" class="pagination-link" :disabled="currentPage == i ? true : false" :data-id="i" :class="currentPage == i ? 'active' : ''">
                            {{i}}
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
            <br>
        </section>
        <section v-else>
            <div class="search-panel">
                <div style="display: flex;">
                    <h3 v-if="isEdit"> Edit product </h3> 
                    <h3 v-else> Add new product </h3> 
                    <div class="content-center" style="margin : 0px 8px">
                        <button class="btn" v-on:click="cancelAdd">
                            Cancel
                        </button>
                    </div>  
                </div>
            </div>
            <div class="admin-post-product">
                <div class="form-cont" align="center">
                    <form v-on:submit="storeProduct">
                    <label for="name"> Name </label>
                    <div class="form-row">
                        <input v-model="newProductname" type="text" value="" id="name">
                    </div>
                    <label for="price">  Price </label>
                    <div class="form-row">
                        <input v-model="newProductprice" type="number" value="" id="price" min="0">
                    </div>
                    <label for="stock"> Stock </label>
                    <div class="form-row">
                        <input v-model="newProductstock" type="number" value="" id="stock" min="1">
                    </div>
                    <label for="image"> image </label>
                    <div class="form-row">
                        <input ref="productFile" v-on:change="setImagePath" type="file" value="" id="image" accept="image/*">
                    </div>
                    <div class="form-row">
                        <button :disabled="isLoading" type="submit">
                            {{isEdit ? 'Edit product' : 'post product'}}
                            <span v-if="isLoading" class="loader"></span>
                        </button>
                    </div>
                    </form>
                </div>
            </div>
        </section>
    `
}