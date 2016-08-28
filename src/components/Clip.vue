<template>
    <input type="file" class="file" accept="image/*;capture=camera" name="img" @change="clipImg($event)">
    <div class="clip-img" @click="previewClipImg">
        <img :src="clipUrl" alt="" v-if="clipUrl">
    </div>
    <div class="upload-wp">
        <button @click="uploadImg">上传</button>
        <p v-if="isUpload">{{clipUrl.substr(0,1000) + '...'}}</p>
    </div>
    <div class="preview-wp" @click="cancelPreview" v-if="isPreview">
        <img class="preview-img" :src="clipUrl" alt="预览图"></div>
	<div class="clip-wp" id="clip-wp" v-show="isClip" >
		<div id="container"></div>
		<button id="save-img" @click="saveImg">保存</button>
	</div>
</template>

<script>
    import clip from '../clip/clip';

	export default{
		data(){
			return{
                isClip:false,
                isPreview:false,
                isUpload:false,
                clipUrl:'',
                noScoll:function(evt){
                	this.isClip && evt.preventDefault();
                },
                clip:{},
			}
		},
		methods:{
             previewClipImg(){
                if (!this.clipUrl) {
                    return;
                }
                this.isPreview =  true;
            },
            cancelPreview(){
                this.isPreview =  false;
            },
            clipImg(event){
                this.clip = new clip('container',this);
                this.clip.init(event.target.files[0]);
                this.isClip = true;
                document.body.addEventListener('touchmove',this.noScoll,false);

            },
            saveImg(){
                this.isClip = false;
                this.clip.save();
                document.body.removeEventListener('touchmove',this.noScoll,false);

            },
            uploadImg(){
                //上传到服务器或进行相关操作
                this.isUpload = true;
            }		
		}
	}
</script>

<style lang="less">
body{
    padding: 0;
    margin: 0;
}
.file{
    height: 40px;
    display: block;
    margin: 40px auto 0;
}
.clip-img{
    width: 300px;
    height: 225px;
    margin: 20px auto 0;
    border: 1px solid #999;
    overflow: hidden;
    img{
        width: 100%;
    }
}
.upload-wp{
    text-align: center;
    width: 300px;
    margin: 20px auto 0;
    button{
        padding: 5px 10px;
    }
    p{
        word-wrap: break-word;
        font-size: 12px;
    }
}
.clip-wp{
    position: fixed;
    width: 100%;
    top: 0;
    bottom: 0;
    z-index: 11;
    background-color: #000;
    text-align: center;
    #container{
        background-color: #000;
        text-align: center;
        width: 100%;
        left: 0;
        right: 0;
        top: 20px;
        bottom: 80px;
        margin: 0 auto;
        position: absolute;       
    }
    #save-img{
        position: absolute;
        bottom: 20px;
        width: 90%;
        left: 5%;
        height: 42px;
        line-height: 42px;
        color: #fff;
        background-color: #32c47c;
        border-radius: 20px;
    }
    #image-box {
        position: absolute;
        left: 0px;
        right: 0px;
        bottom: 0px;
        top: 0px;
        margin: auto;
    }
    #cover-box {
        position: absolute;
        z-index: 9999;
        display: none;
        left: 0px;
        right: 0px;
        bottom: 0px;
        top: 0px;
        margin: auto;
    }
}
.preview-wp{
    text-align: left;
    position: fixed;
    top: 0;
    bottom: 0;
    width: 100%;
    background-color: #000;
    overflow:auto;
    .preview-img{
        position: absolute;
        top: 50%;
        width: 100%;
        transform: translate(0 , -50% ); 
        -webkit-transform: translate(0 ,-50%);
    }
}  
</style>