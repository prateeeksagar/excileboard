import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group"
import { useRootStore } from "@/store/RootStore"

function ZoomControls() {
    const { rootStore } = useRootStore()
    const zoom = rootStore.canvasManager.zoomManager
    return (
        <ButtonGroup>
            <Button variant="outline" onClick={() => zoom.zoomOut()}>-</Button>
            <ButtonGroupSeparator/>
            <ButtonGroupText>{Math.trunc(zoom.getZoomPercent())}%</ButtonGroupText>
            <Button variant="outline" onClick={() => zoom.zoomIn()}>+</Button>
        </ButtonGroup>
    )
}

export default observer(ZoomControls)
