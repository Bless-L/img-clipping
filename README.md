## 基于Canvas的一个h5移动端图片裁剪demo

先运行
```
npm install
```
然后
```
npm run clip
```
接着打开
```
localhost:8080
```

前阵子七夕的时候搞了一个h5活动页，需要做一个本地图片的裁剪上传功能，用于生成一些特定的表白图片。主要是用到了H5的[FileApi][1] 和 [Canvas][2]。个人感觉图片裁剪功能还是很实用的，故写篇文章分享一下。

效果gif：
![效果图demo][3]

（PS：这个demo本来是移动端的，但了为了方便录制效果，所以我用chrome模拟地跑了一下。
还有就是demo是配合[Vue][4]实现的，因为我是直接在项目中复制过来改改的，就懒得转换了）

# **图片读取**
----------
要裁剪首先肯定就是读取图片文件。其实也很简单，用一个input指定为file类型就可以了。
```
<input type="file" class="file" accept="image/*;capture=camera" name="img" @change="clipImg($event)">

//Vue里面的methods
clipImg(event){
    this.clip = new Clip('container',this);
    this.clip.init(event.target.files[0]);
    this.isClip = true;
    document.body.addEventListener('touchmove',this.noScoll,false);
},
```

然后就是处理获得的文件

```javascript
//这些方法是写在Clip类里面的

handleFiles(file){
    let t = this;
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
        t.imgUrl = this.result;
        t.paintImg(this.result);
    }
}
```
先新建一个`FileReader`类，然后把读得的文件用`readAsDataURL`转换为base64编码，再通过`paintImg`方法进行绘制处理。
需要注意的是文件读取是异步的，所以读取后的操作需要在`onload`函数中进行。

# **绘制裁剪界面**
----------

### **初始化**
先是初始化一些基本参数
```
//初始化
init(file){
    this.sx = 0; //裁剪框的初始x
    this.sy = 0; //裁剪框的初始y
    this.sWidth = 233; //裁剪框的宽
    this.sHeight = 175; //裁剪框的高 
    this.chooseBoxScale = 233/175;//裁剪框的宽高比

    this.handleFiles(file);
}
```
在这里裁剪框的比例是固定的4：3，有需要的同学可以自行更改。至于宽高那个是先照着设计稿设一个数值，后面会根据不同的图片而重新设置。

### **绘制裁剪界面**
```javascript
paintImg(picUrl){
    //other code
    //.....
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
        //(1)
    }
```

这段代码比较长。

先说一下裁剪界面的结构。看那demo及动图可以知道，裁剪界面中，首先有一个最外层的容器，装着图片，即id为`container`的div，称为1；
然后是图片容器，即id为`image-box`的canvas，称为2；
最后是最外面被掏空裁剪区域的模糊层，即id为`cover-box`的canvas，称为3。

这几个容器中，1的宽高是固定的。而2则在保证比例不变的情况下有一边占满整个1。所以可以看到上面那段判断盒子与图片比列的代码是在实现这个显示方式。
同时可以看到3的裁剪区域也是同理的，在保证比例不变的情况下有一边占满整个2。亦即裁剪区域的比例是在事先就设计好的，在这里是4：3。

所以我在效果图中将**高填满容器**和**宽填满容器**的图片都演示了一遍。

### **一些处理**
```
    //续上面(1)
    
    //高分屏下图片模糊，需要2倍处理
    t.getImage.height = 2 * t.imgHeight;
    t.getImage.width = 2 * t.imgWidth;
    t.getImage.style.width = t.imgWidth + 'px';
    t.getImage.style.height = t.imgHeight + 'px';
    
    let vertSquashRatio = t.detectVerticalSquash(img);
    
    cxt.drawImage(img, 0, 0,2 * t.imgWidth * vertSquashRatio, 2 * t.imgHeight * vertSquashRatio)
    
    t.cutImage();
    t.drag();
```

第一个是高分屏下图片模糊的问题，在高分屏下用canvas绘制某些图片是会出现模糊，估计是和canvas的绘制机制有关，具体原因[戳这里][5]。解决办法也比较简单，将canvas的css宽高固定，容器宽高扩大两倍。（我的理解，css宽高就是canvas标签style样式设置的宽高，容器宽高就是里面那个画板的宽高，不是同一个东西）经过这样的处理后，绝大多数图片的模糊问题解决了。

第二个是图片绘制压缩问题，在低版本的ios机型下绘制1m多以上的图片时会出现压缩，翻转等问题，详情及解决办法[戳这里][6]。我上面就是用了一个stackflow里面的fix方法。

从这两个问题可以见到，canvas绘制还不是非常成熟，使用时要注意一些bug及相关修复办法。


### **移动时绘制**
```
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
```
这里逻辑不算太复杂，先是记录初始位置，然后判断是左右移动还是上下移动（对应高填满容器和宽填满容器），再根据pageX，pageY这些判断位置量即可。


### **保存图片**
```
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
```
这部分也挺简单的，裁剪框那里记录了裁剪开始及结束的坐标，然后新建一个canvas裁出来，并用`toDataURL`方法转换为base64编码，就可以传输到后台了。我这里裁剪后的尺寸是固定的，这是业务需求，有需要的可以更改

### **总结**
大致的流程就是这样，感谢大家的阅读，如有错误，多多包涵。






  [1]: https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader
  [2]: https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial
  [3]: https://cdn.rawgit.com/Bless-L/img-clipping/master/post_pic/demo.gif
  [4]: http://cn.vuejs.org/
  [5]: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
  [6]: http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios