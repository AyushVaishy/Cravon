import { logout as logoutApi } from "../services/authService";
import { logout as logoutAction } from "../store/authSlice";
import { clearCart } from "../store/cartSlice";

export const performLogout = async (dispatch) => {
  try {
    await logoutApi();
  } catch {
    /* still clear local session */
  }
  dispatch(logoutAction());
  dispatch(clearCart());
};
