import cron from "node-cron";
import Center from "../models/Center.js";
import {
  generateOverduePaymentNotifications,
} from "./notificationService.js";

const startNotificationScheduler = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        const centers = await Center.find({
          status: "active",
        }).select("_id");

        for (const center of centers) {
          try {
            const result =
              await generateOverduePaymentNotifications(
                center._id
              );

            console.log(
              `Center ${center._id}: ${result.created} notifications created`
            );
          } catch (error) {
            console.error(
              `Notification error for center ${center._id}:`,
              error.message
            );
          }
        }
      } catch (error) {
        console.error(
          "Notification scheduler error:",
          error.message
        );
      }
    },
    {
      timezone: "Africa/Casablanca",
    }
  );
};

export default startNotificationScheduler;