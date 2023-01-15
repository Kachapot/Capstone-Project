exports.paginate = (page,all_page)=>{
    try {
        let previous = true
        let next = true
        let page_item = []
        
        if(page > 1 && page < all_page){
        page_item = [{page:page-1,active:false},{page:page,active:true},{page:page+1,active:false}]
        }else{
        if(page >= all_page){
            page_item = [{page:page-2,active:false},{page:page-1,active:false},{page:page,active:true}]
            next = false
            page = all_page
        }else if(page<=1){
            previous = false
            page = 1
            page_item = [{page:1,active:true},{page:2,active:false},{page:3,active:false}]
        }
        }
        if (all_page <= 1) {
        page_item = [{page:1,active:true}]
        previous = false,
        next = false
        }else if(all_page == 2){
            if(page == all_page){
                page_item = [{page:1,active:false},{page:2,active:true}]
                previous = true,
                next = false
            }else{
                page_item = [{page:1,active:true},{page:2,active:false}]
                previous = false,
                next = true
            }
        }
        
        return payload = {
        page_item:page_item,
        page : page,
        all_page: all_page,
        previous:previous,
        next : next
        }
    } catch (error) {
        console.log(error);
        return false
    }
}

exports.page_PN = (page,pageType)=>{
    if(pageType == 'Previous'){
        page = page-1
      }
      if(pageType == 'Next'){
        page = page+1
      }
    return page
}