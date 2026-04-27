import * as THREE from 'three'
import * as RenderUtils from './mbta-render-utils'
import { Text } from 'troika-three-text'
import * as mbtaUi from './mbta-ui'

// TODO: PickHelper clicking
// Clicking should call mbta-ui updateSelectionInfo
// Clicking should persist highlight & preview text
// Clicking off (onto null or another mesh) should adjust accordingly
// Clicked mesh should persist across live updates
//FIXME: Picking still occurs under left and right control panels (CSS issue or PickHelper issue?)
export class PickHelper {
  constructor () {
    this.raycaster = new THREE.Raycaster()
    this.pickPosition = { x: -100000, y: -100000 }

    this.hoveredObject = null
    this.hoveredObjectSavedColor = 0

    // this.pickedObject = null
    // this.pickedObjectSavedColor = 0

    this.previewText = new Text()
    this.previewText.text = `preloading`
    this.previewText.fontSize = 0.05
    this.previewText.color = 0xffff00
    this.previewText.fontWeight = `bold`
    this.previewText.sync()
  }

  setPickPosition (event, canvas) {
    const rect = canvas.getBoundingClientRect()
    this.pickPosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pickPosition.y = ((event.clientY - rect.top) / rect.height) * -2 + 1
  }

  clearPickPosition () {
    this.pickPosition.x = -100000
    this.pickPosition.y = -100000
  }

  getIntersectedObjects (sceneData, app) {
    this.raycaster.setFromCamera(this.pickPosition, app.camera)

    const pickables = [sceneData.stopMeshes, sceneData.vehicleMeshes]
    const hits = this.raycaster.intersectObjects(pickables, true)
    const hit = hits.length ? hits[0].object : null
    return hit
  }

  pick (sceneData, app) {
    const newHoveredObject = this.getIntersectedObjects(sceneData, app)

    if (newHoveredObject === this.hoveredObject) return

    // Restore old
    if (this.hoveredObject?.material?.color) {
      this.hoveredObject.material.color.setHex(this.hoveredObjectSavedColor)
    }

    this.hoveredObject = newHoveredObject

    if (!this.hoveredObject) {
      this.previewText.visible = false
      return
    }

    // Highlight new
    if (this.hoveredObject.material?.color) {
      this.hoveredObjectSavedColor = this.hoveredObject.material.color.getHex()
      this.hoveredObject.material.color.setHex(0xffff00)
    }

    // Update text
    this.previewText.text = this.hoveredObject.userData.id
    this.previewText.position.copy(this.hoveredObject.position)
    this.previewText.visible = true
    this.previewText.sync()

    if (!this.previewText.parent) {
      app.scene.add(this.previewText)
    }

    // Update selection info
    mbtaUi.updateSelectionInfo(this.hoveredObject.userData)
  }
}
