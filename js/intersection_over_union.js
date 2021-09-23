function IntersectionOverUnionLoss(realBoxes, predBoxes, threshold, ctx) {
    this.realBoxes = realBoxes
    this.predBoxes = predBoxes
    this.threshold = threshold
    this.ctx = ctx
}

IntersectionOverUnionLoss.prototype.EvaluateCounts = function(isMask = false) {
    if (this.realBoxes.length == 0 || this.predBoxes.length == 0)
        return { tp: 0, fp: 0, fn: 0 }

    let real = []
    let pred = []
    let ious = []
    let sortedIndexes = []

    for (let ipb = 0; ipb < this.predBoxes.length; ipb++) {
        for (let igb = 0; igb < this.realBoxes.length; igb++) {
            let realBox = this.realBoxes[igb]
            let predBox = this.predBoxes[ipb]
            let iou = isMask ? realBox.MaskIoU(predBox, this.ctx) : realBox.IoU(predBox)
            
            if (iou >= this.threshold) {
                real.push(igb)
                pred.push(ipb)
                sortedIndexes.push(ious.length)
                ious.push(iou)
            }
        }
    }

    if (ious.length == 0)
        return { tp: 0, fp: 0, fn: 0 }

    sortedIndexes.sort(function(a, b) { return ious[a] - ious[b] })

    let realMatch = []
    let predMatch = []

    for (let index of sortedIndexes) {
        if (realMatch.indexOf(real[index]) == -1 && predMatch.indexOf(pred[index]) == -1) {
            realMatch.push(real[index])
            predMatch.push(pred[index])
        }
    }

    tp = realMatch.length
    fp = this.predBoxes.length - predMatch.length
    fn = this.realBoxes.length - realMatch.length
    
    return { tp: tp, fp: fp, fn: fn }
}

IntersectionOverUnionLoss.prototype.Evaluate = function(isMask) {
    let counts = this.EvaluateCounts(isMask)

    let eps = 1e-16
    let precision = counts.tp / (counts.tp + counts.fp + eps)
    let recall = counts.tp / (counts.tp + counts.fn + eps)
    let f1 = 2 * precision * recall / (precision + recall + eps)

    return { precision: precision, recall: recall, f1: f1 }
}