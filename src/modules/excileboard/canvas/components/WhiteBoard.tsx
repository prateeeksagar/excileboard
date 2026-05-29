import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRootStore } from "../../../../store/RootStore";

function WhiteBoard() {
  const { rootStore } = useRootStore();
  const { canvasManager } = rootStore;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasManager.init(canvasRef.current);
    return () => canvasManager.dispose();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
}

export default observer(WhiteBoard);
