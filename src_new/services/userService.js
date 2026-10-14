// src/services/userService.js
import api from "../utils/api";


const userService = {
  registerFcmToken: async (user_id,token) => {
    try {
      const response = await api.post("public_app/postplayer_id", {user_id: user_id, player_id: token});
      
      return response.data;
    } catch (error) {
      console.error("Failed to register FCM token:", error);
      throw error;
    }
  },
};

export default userService;

