Visualizer.prototype.Clear = function() {
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.canvas.style.cursor = 'default'
}

Visualizer.prototype.UpdateCursor = function(bbox, x, y) {
    if (bbox.IsResize(x, y)) {
        this.canvas.style.cursor = bbox.GetResizeDir(x, y) + '-resize'
    }
    else {
        this.canvas.style.cursor = 'pointer'
    }
}

Visualizer.prototype.DrawBboxes = function() {
    for (let bbox of this.bboxes) {
        if (bbox != this.activeBox) {
            bbox.Draw(this.ctx)
        }

        if (bbox.IsMouseHover(this.currPoint.x, this.currPoint.y)) {
            this.UpdateCursor(bbox, this.currPoint.x, this.currPoint.y)
        }
    }
}

Visualizer.prototype.Round = function(v) {
    return Math.round(v * 100) / 100
}

Visualizer.prototype.DrawLoss = function() {
    let real = this.GetBoxesByColor(BBOX_REAL_COLOR)
    let pred = this.GetBoxesByColor(BBOX_PRED_COLOR)

    this.metrics.innerHTML = ''

    if (real.length == 1 && pred.length == 1) {
        this.metrics.innerHTML = 'IoU: ' + real[0].IoU(pred[0]) + '<br>'
        this.metrics.innerHTML += 'Mask: ' + real[0].MaskIoU(pred[0], this.ctx) + '<br>'
        return
    }

    let thresholds = [ 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    let table = '<table><tr><th>threshold</th><th>IoU</th><th>Mask</th></tr>'

    for (threshold of thresholds) {
        let iou = new IntersectionOverUnionLoss(real, pred, threshold, this.ctx)
        let iouLoss = iou.Evaluate(false)
        let maskLoss = iou.Evaluate(true)

        table += '<tr>'
        // this.metrics.innerHTML += `IoU@${threshold}: R=${this.Round(iouLoss.recall)}, P=${this.Round(iouLoss.precision)}, f<sub>1</sub>=${this.Round(iouLoss.f1)}<br>`
        // this.metrics.innerHTML += `Mask@${threshold}: R=${this.Round(maskLoss.recall)}, P=${this.Round(maskLoss.precision)}, f<sub>1</sub>=${this.Round(maskLoss.f1)}<br><br>`

        table += `<td>${threshold}</td><td>R:${this.Round(iouLoss.recall)}, P:${this.Round(iouLoss.precision)}, f<sub>1</sub>:${this.Round(iouLoss.f1)}</td>`
        table += `<td>R:${this.Round(maskLoss.recall)}, P:${this.Round(maskLoss.precision)}, f<sub>1</sub>:${this.Round(maskLoss.f1)}</td>`
        table += '</tr>'
    }

    this.metrics.innerHTML += table
}

Visualizer.prototype.Draw = function() {
    this.Clear()
    this.ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight)

    if (this.needUpdate) {       
        this.needUpdate = false
        this.DrawLoss()
    }

    this.DrawBboxes()

    if (this.activeBox != null) {
        this.activeBox.Draw(this.ctx, true)
    }
}
