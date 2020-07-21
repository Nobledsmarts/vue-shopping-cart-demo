const util = {
    data(){
        return {
            limit : 5,
            currentPage : 1,
        }
    },
    computed : {
        getCurrentPage(){
            let query = this.$root.$route.query;
            return Object.keys(query).length ? query.page : 1;
        },
    },
    methods : {
        pages(from){
            return this.getPageLength((this[from]).length, this.limit);
        },
        getPageLength(total, limit){
            let i = 0,
            arr = [];
            if(total > limit && limit > 0){
                while(total > limit){
                    total = total - limit;
                    i++;
                }
                for(let counter = 1; counter <= i + 1; ++counter){
                    arr[arr.length] = counter;
                }
                return arr;
            } else {
                return [];
            }
        },
        filter(products){
           return products.slice((this.currentPage == 1 ? this.currentPage - 1 : (this.currentPage - 1) * this.limit )).slice(0, this.limit);
       },
    }
}