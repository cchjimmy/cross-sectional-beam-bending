const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

main();

function main() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  
  // window.onresize = () => {
  //   canvas.width = window.innerWidth;
  //   canvas.height = window.innerHeight;
  // }
  
  let rects = [new Rectangle(5, 65, 10, 110), new Rectangle(50, 5, 100, 10)]
  evalRects(rects);
  
  //console.log(bendingStressAt(-47.778, [new Rectangle(0, 5, 100*200/70, 10), new Rectangle(0, 60, 100, 100)], 1500)*200/70);
}

function Rectangle(x = 0, y = 0, w = 10, h = 10) {
  // x, y is centroid position
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
  this.area = this.width*this.height;
  
  // Moment of inertia from centroid
  this.I = {
    x: this.width*this.height**3/12,
    y: this.height*this.width**3/12,
    xy: 0
  }
}

function bendingStressAt(height, rects, bendingMoment) {
  // Bending stress = M*y/I_x (External bending moment * vertical height from centroid horizontal axis / moment of inertia with respect to horizontal axis)
  // Centroid calculations
  let xTimesArea = 0;
  let yTimesArea = 0;
  let totalArea = 0;
  for (let i = 0; i < rects.length; i++) {
    xTimesArea += rects[i].x * rects[i].area;
    yTimesArea += rects[i].y * rects[i].area;
    totalArea += rects[i].area;
  }
  // Centroid x, y
  let Cx = xTimesArea / totalArea;
  let Cy = yTimesArea / totalArea;
  
  // Composite moment of inertia calculations
  let Ix = 0;
  let Iy = 0;
  let Ixy = 0;
  for (let i = 0; i < rects.length; i++) {
    Ix += rects[i].I.x + rects[i].area * (rects[i].y - Cy) ** 2;
    Iy += rects[i].I.y + rects[i].area * (rects[i].x - Cx) ** 2;
    Ixy += (rects[i].x - Cx) * (rects[i].y - Cy) * rects[i].area;
  }
  
  return -bendingMoment * height / Ix;
}

function evalRects(rects = []) {
  // Warning! Do not include overlapping rectangles
  // Centroid calculations
  let xTimesArea = 0;
  let yTimesArea = 0;
  let totalArea = 0;
  for (let i = 0; i < rects.length; i++) {
    xTimesArea += rects[i].x * rects[i].area;
    yTimesArea += rects[i].y * rects[i].area;
    totalArea += rects[i].area;
  }
  // Centroid x, y
  let Cx = xTimesArea/totalArea;
  let Cy = yTimesArea/totalArea;
  
  // Composite moment of inertia calculations
  let Ix = 0;
  let Iy = 0;
  let Ixy = 0;
  for (let i = 0; i < rects.length; i++) {
    Ix += rects[i].I.x + rects[i].area * (rects[i].y-Cy) ** 2;
    Iy += rects[i].I.y + rects[i].area * (rects[i].x-Cx) ** 2;
    Ixy += (rects[i].x-Cx)* (rects[i].y-Cy) * rects[i].area;
  }
  
  // 2 * radians from positive x to principal axis;
  let twoTheta = Math.atan(-2*Ixy/(Ix-Iy));
  
  // Moment of inertia of principal axis u, v (like x, y respectively)
  let Iu = 0.5 * (Ix + Iy) + 0.5 * (Ix - Iy) * Math.cos(twoTheta) - Ixy * Math.sin(twoTheta);
  let Iv = 0.5 * (Ix + Iy) - 0.5 * (Ix - Iy) * Math.cos(twoTheta) + Ixy * Math.sin(twoTheta);
  
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  
  // Render text information
  ctx.font = '18px Menlo';
  let text = `white: input, red: centered, green: principal;Cx: ${Cx};Cy: ${Cy};Ix: ${Ix};Iy: ${Iy};Ixy: ${Ixy};2θ: ${twoTheta};Iu: ${Iu};Iv: ${Iv}`;
  let textMetrics = ctx.measureText(text);
  let splitText = text.split(';');
  for (let i = 0; i < splitText.length; i++) {
    if (i > 2) ctx.fillStyle = 'pink';
    if (i > 5) ctx.fillStyle = 'lightgreen';
    ctx.fillText(splitText[i], -canvas.width / 2, -canvas.height / 2 + textMetrics.emHeightAscent * (i + 1));
  }
  
  // Draws center point
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(10, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.stroke();
  
  ctx.globalAlpha = 0.5;
  
  // Draws input rects
  ctx.save();
  ctx.fillStyle = 'white';
  for (let i = 0; i < rects.length; i++) {
    ctx.fillRect(rects[i].x-rects[i].width/2, -rects[i].y-rects[i].height/2, rects[i].width, rects[i].height);
  }
  ctx.restore();
  
  // Draws centered rects
  ctx.save();
  ctx.fillStyle = 'pink';
  for (let i = 0; i < rects.length; i++) {
    ctx.fillRect(rects[i].x-Cx-rects[i].width/2, -rects[i].y+Cy-rects[i].height/2, rects[i].width, rects[i].height);
  }
  ctx.restore();
  
  // Draws principal rects
  ctx.save();
  ctx.fillStyle = 'lightgreen';
  for (let i = 0; i < rects.length; i++) {
    ctx.save();
    // Rotates rects to principal axis, needs minus sign to rotate anticlockwise from positive x
    ctx.rotate(-twoTheta/2);
    ctx.translate(rects[i].x-Cx-rects[i].width/2, -rects[i].y+Cy-rects[i].height/2);
    ctx.fillRect(0, 0, rects[i].width, rects[i].height);
    ctx.restore();
  }
  ctx.restore();
  
  ctx.restore();
}