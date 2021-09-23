function Visualizer(canvasId, imageSrc, metricsId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.image = this.LoadImage(imageSrc)
    this.metrics = document.getElementById(metricsId)
}

Visualizer.prototype.LoadImage = function(src) {
    let image = new Image()

    image.src = src
    image.onload = () => {
        this.imageWidth = image.width
        this.imageHeight = image.height
        this.InitEvents()
        this.Reset()
    }

    return image
}

Visualizer.prototype.InitEvents = function() {
    window.addEventListener('resize', () => this.WindowResize())
    this.canvas.addEventListener('mousedown', (e) => this.MouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.MouseMove(e))
    this.canvas.addEventListener('mouseup', (e) => this.MouseUp(e))
    window.addEventListener('keydown', (e) => this.KeyDown(e))

    this.WindowResize()
}

Visualizer.prototype.Reset = function() {
    this.bboxes = []
    this.activeBox = null

    this.isPressed = false
    this.currPoint = { x: -1, y: -1 }
    this.prevPoint = { x: -1, y: -1 }
    this.action = ACTION_NONE
}

Visualizer.prototype.GetBboxAt = function(x, y) {
    for (let i = this.bboxes.length - 1; i >= 0; i--) {
        if (this.bboxes[i].IsMouseHover(x, y)) {
            let bbox = this.bboxes[i]
            this.bboxes.splice(i, 1)
            this.bboxes.push(bbox)
            return bbox
        }
    }

    return null
}

Visualizer.prototype.RemoveActiveBbox = function() {
    let index = this.bboxes.indexOf(this.activeBox)

    if (index > -1) {
        this.bboxes.splice(index, 1)
    }

    this.activeBox = null
    this.needUpdate = true
}

Visualizer.prototype.MakeAction = function(dx, dy) {
    if (this.action == ACTION_RESIZE) {
        this.activeBox.Resize(this.resizeDir, dx, dy)
    }
    else if (this.action == ACTION_MOVE || this.action == ACTION_CREATE) {
        this.activeBox.Move(dx, dy)
    }

    this.needUpdate = true
}

Visualizer.prototype.GetBoxesByColor = function(color) {
    let bboxes = []

    for (bbox of this.bboxes)
        if (bbox.color == color)
            bboxes.push(bbox)

    return bboxes
}

Visualizer.prototype.EvaluateIntersectionOverUnion = function(threshold) {
    for (let bbox of this.bboxes)
        bbox.text = ''

    let real = this.GetBoxesByColor(BBOX_REAL_COLOR)
    let pred = this.GetBoxesByColor(BBOX_PRED_COLOR)
    let iou = new IntersectionOverUnionLoss(real, pred, threshold)
    let loss = iou.Evaluate()
}

Visualizer.prototype.RestoreBboxes = function(data) {
    bboxes = JSON.parse(data)

    for (let bbox of bboxes) {
        let box = new BoundingBox(bbox.x1, bbox.y1, bbox.x2, bbox.y2, bbox.color)
        box.isCreated = bbox.isCreated
        this.bboxes.push(box)
    }
}

Visualizer.prototype.GetIoU = function() {
    let realBoxes = this.GetBoxesByColor(BBOX_REAL_COLOR)
    let predBoxes = this.GetBoxesByColor(BBOX_PRED_COLOR)

    if (realBoxes.length != 1 || predBoxes.length != 1)
        return { 'iou': 0, 'mask': 0 }

    let real = realBoxes[0]
    let pred = predBoxes[0]

    return { 'iou': real.IoU(pred), 'mask': real.MaskIoU(pred, this.ctx) }
}