import { Routes, Route } from "react-router-dom";
import { Home } from "../pages";

export default function Routers() {
  return (
    <Routes>
      <Route element={<Home />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  );
}
