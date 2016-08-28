class Clip{
    //因为要保存到vue实例中，所以直接传一个$vm当闭包使用了
    constructor(wpId,$vm){
        this.regional = document.getElementById(wpId);
        this.getImage = document.createElement('canvas');
        this.getImage.id = 'image-box';
        this.editBox = document.createElement('canvas');
        this.editBox.id = 'cover-box';

        this.regional.appendChild(this.getImage);
        this.regional.appendChild(this.editBox);
        this.$vm = $vm;
    }
    init(file){
        this.sx = 0; //裁剪框的初始x
        this.sy = 0; //裁剪框的初始y
        this.sWidth = 233; //裁剪框的宽
        this.sHeight = 175; //裁剪框的高 
        this.chooseBoxScale = 233/175;
        this.file = file

        this.handleFiles();
    }
    handleFiles(){
        let t = this;
        let reader = new FileReader();
        reader.readAsDataURL(t.file);
        reader.onload = function() {
            t.imgUrl = this.result;
            t.paintImg(this.result);
        }
    }
    paintImg(picUrl){
        let t = this;
        let cxt = t.getImage.getContext('2d');
        
        //先清空画布
        cxt.clearRect(0, 0, this.getImage.width, this.getImage.height);

        let img = new Image();
        img.src = picUrl;

        img.onload = function() {

            let imgScale = img.width / img.height;
            let boxScale = t.regional.offsetWidth / t.regional.offsetHeight;

            //判断盒子与图片的比列
            if (imgScale < boxScale) {
                //设置图片的像素
                t.imgWidth = t.regional.offsetHeight * imgScale;
                t.imgHeight = t.regional.offsetHeight;
            } else {
                //设置图片的像素
                t.imgWidth = t.regional.offsetWidth;
                t.imgHeight = t.regional.offsetWidth / imgScale;
            }

            //判断图片与选择框的比例大小，作出裁剪
            if (imgScale < t.chooseBoxScale) {
                //设置选择框的像素
                t.sWidth = t.imgWidth;
                t.sHeight = t.imgWidth / t.chooseBoxScale;

                //设置初始框的位置
                t.sx = 0;
                t.sy = (t.imgHeight - t.sHeight) / 2;
            } else {
                //设置选择框的像素
                t.sWidth = t.imgHeight * t.chooseBoxScale;
                t.sHeight = t.imgHeight;

                t.sx = (t.imgWidth - t.sWidth) / 2;
                t.sy = 0;
            }

            //高分屏下图片模糊，需要2倍处理
            t.getImage.height = 2 * t.imgHeight;
            t.getImage.width = 2 * t.imgWidth;
            t.getImage.style.width = t.imgWidth + 'px';
            t.getImage.style.height = t.imgHeight + 'px';

            let vertSquashRatio = t.detectVerticalSquash(img);

            cxt.drawImage(img, 0, 0,2 * t.imgWidth * vertSquashRatio, 2 * t.imgHeight * vertSquashRatio)

            t.cutImage();
            t.drag();
        }       
    }
    cutImage(){
        let t = this;

        //绘制遮罩层：
        t.editBox.height =2 * t.imgHeight;
        t.editBox.width =2 * t.imgWidth;

        t.editBox.style.display = 'block';
        t.editBox.style.width = t.imgWidth + 'px';
        t.editBox.style.height = t.imgHeight + 'px';

        let cover = t.editBox.getContext("2d");
        cover.fillStyle = "rgba(0, 0, 0, 0.7)";

        cover.fillRect(0, 0, 2 * t.imgWidth, 2 * t.imgHeight);
        cover.clearRect(2 *t.sx, 2 * t.sy, 2 * t.sWidth, 2 * t.sHeight);
    }
    drag(){
        let t = this;
        let draging = false;

        //记录初始点击的pageX，pageY。用于记录位移
        let pageX = 0;
        let pageY = 0;

        //初始位移
        let startX = 0;
        let startY = 0;


        t.editBox.addEventListener('touchmove', function(ev) {
            let e = ev.touches[0];

            let offsetX = e.pageX - pageX;
            let offsetY = e.pageY - pageY;
            if (draging) {

                if (t.imgHeight == t.sHeight) {

                    t.sx = startX + offsetX;

                    if (t.sx <= 0) {
                        t.sx = 0;
                    } else if (t.sx >= t.imgWidth - t.sWidth) {
                        t.sx = t.imgWidth - t.sWidth;
                    }
                } else {
                    t.sy = startY + offsetY;

                    if (t.sy <= 0) {
                        t.sy = 0;
                    } else if (t.sy >= t.imgHeight - t.sHeight) {
                        t.sy = t.imgHeight - t.sHeight;
                    }
                }
                t.cutImage();
            }
        });
        t.editBox.addEventListener('touchstart', function(ev) {
            let e = ev.touches[0];
            draging = true;

            pageX = e.pageX;
            pageY = e.pageY;

            startX = t.sx;
            startY = t.sy;

        })
        t.editBox.addEventListener('touchend', function() {
            draging = false;
        })
    }
    save(){
        let t = this;
        let saveCanvas = document.createElement('canvas');
        let ctx = saveCanvas.getContext('2d');

        //图片裁剪后的尺寸
        saveCanvas.width = 466;
        saveCanvas.height = 350;

        let images = new Image();
        images.src = t.imgUrl;

        images.onload = function(){

            //计算裁剪尺寸比例，用于裁剪图片
            let cropWidthScale = images.width/t.imgWidth;
            let cropHeightScale = images.height/t.imgHeight;

            t.drawImageIOSFix(ctx, images,cropWidthScale * t.sx , cropHeightScale* t.sy,
                            t.sWidth * cropWidthScale, t.sHeight * cropHeightScale, 0, 0, 466, 350);
        //    ctx.drawImage(images,2 * t.sx, 2 * t.sy, t.sWidth * 2, t.sHeight * 2, 0, 0, 466, 350);
            t.$vm.clipUrl = saveCanvas.toDataURL();
            t.regional.removeChild(t.getImage);
            t.regional.removeChild(t.editBox);
        }
    }
    //用于修复ios下的canvas截图问题
    //详情可以看这里http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
    detectVerticalSquash(img) {
        if(/png$/i.test(img.src)) {
            return 1;
        }
        let iw = img.naturalWidth, ih = img.naturalHeight;
        let canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = ih;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        let data = ctx.getImageData(0, 0, 1, ih).data;
        
        let sy = 0;
        let ey = ih;
        let py = ih;
        while (py > sy) {
            const alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py;
            } else {
                sy = py;
            }
            py = (ey + sy) >> 1;
        }
        const ratio = (py / ih);
        return (ratio===0)?1:ratio;
    }
    drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        const vertSquashRatio = this.detectVerticalSquash(img);
        ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio, 
                           sw * vertSquashRatio, sh * vertSquashRatio, 
                           dx, dy, dw, dh );
    }
}

export default Clip;