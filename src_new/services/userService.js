// src/services/userService.js
import api from "../utils/api";


const userService = {
  registerFcmToken: async (user_id,token) => {
    try {
      console.log('[FCM] Sending postplayer_id ->', {user_id, player_id: token});
      const response = await api.post("public_app/postplayer_id", {user_id: user_id, player_id: token});
      console.log('[FCM] postplayer_id ->', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to register FCM token:", error?.response?.status, error?.response?.data || error);
      throw error;
    }
  },
};

export default userService;

