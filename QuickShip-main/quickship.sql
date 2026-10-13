-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: quickship
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `parcel_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `parcel_id` (`parcel_id`),
  CONSTRAINT `activity_logs_ibfk_29` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activity_logs_ibfk_30` FOREIGN KEY (`parcel_id`) REFERENCES `parcels` (`parcel_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,5,'Bibusa Shrestha','staff','changed parcel TRK-404885 to Picked Up',2,NULL,'2026-08-29 03:57:37'),(2,5,'Bibusa Shrestha','staff','changed parcel TRK-404885 to In Transit',2,NULL,'2026-08-29 03:57:43'),(3,5,'Bibusa Shrestha','staff','changed parcel TRK-404885 to Out for Delivery',2,NULL,'2026-08-29 03:57:45'),(4,5,'Bibusa Shrestha','staff','marked parcel TRK-404885 as Delivered',2,NULL,'2026-08-29 03:58:39'),(5,6,'Soichchha Khadka','staff','changed parcel TRK-785344 to Picked Up',3,NULL,'2026-08-29 03:58:59'),(6,6,'Soichchha Khadka','staff','changed parcel TRK-785344 to In Transit',3,NULL,'2026-08-29 03:59:01'),(7,6,'Soichchha Khadka','staff','changed parcel TRK-785344 to Out for Delivery',3,NULL,'2026-08-29 03:59:01'),(8,6,'Soichchha Khadka','staff','marked parcel TRK-785344 as Delivered',3,'Sister taken the delivery','2026-08-29 03:59:53'),(9,7,'Staff ','staff','changed parcel TRK-640917 to Picked Up',4,NULL,'2026-08-29 04:00:06'),(10,7,'Staff ','staff','changed parcel TRK-640917 to In Transit',4,NULL,'2026-08-29 04:00:07'),(11,7,'Staff ','staff','changed parcel TRK-640917 to Out for Delivery',4,NULL,'2026-08-29 04:00:08'),(12,7,'Staff ','staff','recorded a delivery attempt on parcel TRK-640917 and rescheduled it',4,'Customer requested reschedule - Reschedule delivery for next week','2026-08-29 04:00:59'),(13,5,'Bibusa Shrestha','staff','changed parcel TRK-192972 to Picked Up',5,NULL,'2026-08-30 11:24:34'),(14,5,'Bibusa Shrestha','staff','changed parcel TRK-192972 to In Transit',5,NULL,'2026-08-30 11:24:36'),(15,5,'Bibusa Shrestha','staff','changed parcel TRK-192972 to Out for Delivery',5,NULL,'2026-08-30 11:24:38'),(16,5,'Bibusa Shrestha','staff','marked parcel TRK-192972 as Delivered',5,'Mother received it','2026-08-30 11:24:59'),(17,5,'Bibusa Shrestha','staff','changed parcel TRK-237032 to Picked Up',6,NULL,'2026-08-31 05:49:58'),(18,5,'Bibusa Shrestha','staff','changed parcel TRK-237032 to In Transit',6,NULL,'2026-08-31 05:49:58'),(19,5,'Bibusa Shrestha','staff','changed parcel TRK-237032 to Out for Delivery',6,NULL,'2026-08-31 05:49:58'),(20,5,'Bibusa Shrestha','staff','marked parcel TRK-237032 as Delivered',6,NULL,'2026-08-31 05:50:10'),(21,5,'Bibusa Shrestha','staff','changed parcel TRK-951930 to Picked Up',7,NULL,'2026-09-01 07:22:38'),(22,5,'Bibusa Shrestha','staff','changed parcel TRK-951930 to In Transit',7,NULL,'2026-09-01 07:22:39'),(23,6,'Soichchha Khadka','staff','changed parcel TRK-537463 to Picked Up',8,NULL,'2026-09-01 12:46:58'),(24,6,'Soichchha Khadka','staff','changed parcel TRK-537463 to In Transit',8,NULL,'2026-09-01 12:49:50'),(25,6,'Soichchha Khadka','staff','changed parcel TRK-537463 to Out for Delivery',8,NULL,'2026-09-01 12:49:50'),(26,6,'Soichchha Khadka','staff','marked parcel TRK-537463 as Delivered',8,NULL,'2026-09-01 12:50:13'),(27,5,'Bibusa Shrestha','staff','changed parcel TRK-951930 to Out for Delivery',7,NULL,'2026-09-08 06:10:15'),(28,5,'Bibusa Shrestha','staff','marked parcel TRK-951930 as Delivered',7,NULL,'2026-09-08 06:10:33'),(29,7,'Staff ','staff','changed parcel TRK-640917 to Out for Delivery',4,NULL,'2026-09-08 06:11:08'),(30,7,'Staff ','staff','marked parcel TRK-640917 as Delivered',4,NULL,'2026-09-08 06:11:20'),(31,6,'Soichchha Khadka','staff','changed parcel TRK-796315 to Picked Up',9,NULL,'2026-09-08 06:11:32'),(32,6,'Soichchha Khadka','staff','changed parcel TRK-796315 to In Transit',9,NULL,'2026-09-08 06:11:33'),(33,6,'Soichchha Khadka','staff','changed parcel TRK-796315 to Out for Delivery',9,NULL,'2026-09-08 06:11:34'),(34,6,'Soichchha Khadka','staff','marked parcel TRK-796315 as Delivered',9,NULL,'2026-09-08 06:11:48'),(35,6,'Soichchha Khadka','staff','changed parcel TRK-127829 to Picked Up',10,NULL,'2026-09-08 06:11:51'),(36,6,'Soichchha Khadka','staff','changed parcel TRK-127829 to In Transit',10,NULL,'2026-09-08 06:11:51'),(37,6,'Soichchha Khadka','staff','changed parcel TRK-127829 to Out for Delivery',10,NULL,'2026-09-08 06:11:52'),(38,6,'Soichchha Khadka','staff','marked parcel TRK-127829 as Delivered',10,NULL,'2026-09-08 06:12:14'),(39,5,'Bibusa Shrestha','staff','changed parcel TRK-125553 to Picked Up',11,NULL,'2026-09-08 06:17:40'),(40,5,'Bibusa Shrestha','staff','changed parcel TRK-125553 to In Transit',11,NULL,'2026-09-08 06:17:41'),(41,5,'Bibusa Shrestha','staff','changed parcel TRK-125553 to Out for Delivery',11,NULL,'2026-09-08 06:17:41'),(42,5,'Bibusa Shrestha','staff','marked parcel TRK-125553 as Delivered',11,NULL,'2026-09-08 06:17:52'),(43,6,'Soichchha Khadka','staff','changed parcel TRK-218866 to Picked Up',12,NULL,'2026-09-08 06:18:31'),(44,6,'Soichchha Khadka','staff','changed parcel TRK-218866 to In Transit',12,NULL,'2026-09-08 06:18:31'),(45,6,'Soichchha Khadka','staff','changed parcel TRK-218866 to Out for Delivery',12,NULL,'2026-09-08 06:18:31'),(46,6,'Soichchha Khadka','staff','marked parcel TRK-218866 as Delivered',12,NULL,'2026-09-08 06:18:40'),(47,5,'Bibusa Shrestha','staff','changed parcel TRK-777729 to Picked Up',13,NULL,'2026-09-08 06:23:05'),(48,5,'Bibusa Shrestha','staff','changed parcel TRK-777729 to In Transit',13,NULL,'2026-09-08 06:23:06'),(49,5,'Bibusa Shrestha','staff','changed parcel TRK-777729 to Out for Delivery',13,NULL,'2026-09-08 06:23:06'),(50,5,'Bibusa Shrestha','staff','marked parcel TRK-777729 as Delivered',13,NULL,'2026-09-08 06:23:13'),(51,6,'Soichchha Khadka','staff','changed parcel TRK-349651 to Picked Up',14,NULL,'2026-09-08 06:23:29'),(52,6,'Soichchha Khadka','staff','changed parcel TRK-349651 to In Transit',14,NULL,'2026-09-08 06:23:29'),(53,6,'Soichchha Khadka','staff','changed parcel TRK-349651 to Out for Delivery',14,NULL,'2026-09-08 06:23:29'),(54,6,'Soichchha Khadka','staff','marked parcel TRK-349651 as Delivered',14,NULL,'2026-09-08 06:23:40'),(55,5,'Bibusa Shrestha','staff','changed parcel TRK-348426 to Picked Up',15,NULL,'2026-09-08 06:27:59'),(56,5,'Bibusa Shrestha','staff','changed parcel TRK-348426 to In Transit',15,NULL,'2026-09-08 06:27:59'),(57,5,'Bibusa Shrestha','staff','changed parcel TRK-348426 to Out for Delivery',15,NULL,'2026-09-08 06:27:59'),(58,5,'Bibusa Shrestha','staff','marked parcel TRK-348426 as Delivered',15,NULL,'2026-09-08 06:28:08'),(59,6,'Soichchha Khadka','staff','changed parcel TRK-198629 to Picked Up',16,NULL,'2026-09-08 06:28:22'),(60,6,'Soichchha Khadka','staff','changed parcel TRK-198629 to In Transit',16,NULL,'2026-09-08 06:28:22'),(61,6,'Soichchha Khadka','staff','changed parcel TRK-198629 to Out for Delivery',16,NULL,'2026-09-08 06:28:22'),(62,6,'Soichchha Khadka','staff','marked parcel TRK-198629 as Delivered',16,NULL,'2026-09-08 06:28:33'),(63,5,'Bibusa Shrestha','staff','changed parcel TRK-778789 to Picked Up',17,NULL,'2026-09-08 06:30:38'),(64,5,'Bibusa Shrestha','staff','changed parcel TRK-778789 to In Transit',17,NULL,'2026-09-08 06:30:38'),(65,5,'Bibusa Shrestha','staff','changed parcel TRK-778789 to Out for Delivery',17,NULL,'2026-09-08 06:30:38'),(66,5,'Bibusa Shrestha','staff','marked parcel TRK-778789 as Delivered',17,NULL,'2026-09-08 06:30:46'),(67,5,'Bibusa Shrestha','staff','changed parcel TRK-221084 to Picked Up',18,NULL,'2026-09-21 09:18:22'),(68,5,'Bibusa Shrestha','staff','changed parcel TRK-221084 to In Transit',18,NULL,'2026-09-21 09:18:22'),(69,5,'Bibusa Shrestha','staff','changed parcel TRK-221084 to Out for Delivery',18,NULL,'2026-09-21 09:18:22'),(70,5,'Bibusa Shrestha','staff','marked parcel TRK-221084 as Delivered',18,NULL,'2026-09-21 09:18:31'),(71,6,'Soichchha Khadka','staff','changed parcel TRK-574039 to Picked Up',22,NULL,'2026-09-25 05:10:08'),(72,6,'Soichchha Khadka','staff','changed parcel TRK-574039 to In Transit',22,NULL,'2026-09-25 05:10:11'),(73,6,'Soichchha Khadka','staff','changed parcel TRK-574039 to Out for Delivery',22,NULL,'2026-09-25 05:10:13'),(74,6,'Soichchha Khadka','staff','marked parcel TRK-574039 as Delivered',22,NULL,'2026-09-25 05:10:45');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveries`
--

DROP TABLE IF EXISTS `deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deliveries` (
  `delivery_id` int(11) NOT NULL AUTO_INCREMENT,
  `parcel_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_date` datetime DEFAULT NULL,
  `delivery_status` varchar(255) DEFAULT 'Assigned',
  `assignment_type` enum('Manual','Auto') NOT NULL DEFAULT 'Manual',
  `assignment_reason` text DEFAULT NULL,
  `workload_at_assignment` int(11) DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `received_by` varchar(255) DEFAULT NULL,
  `delivery_remarks` text DEFAULT NULL,
  `delivered_by` int(11) DEFAULT NULL,
  `next_delivery_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`delivery_id`),
  UNIQUE KEY `parcel_id` (`parcel_id`),
  KEY `staff_id` (`staff_id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `delivered_by` (`delivered_by`),
  CONSTRAINT `deliveries_ibfk_64` FOREIGN KEY (`parcel_id`) REFERENCES `parcels` (`parcel_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `deliveries_ibfk_65` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `deliveries_ibfk_66` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `deliveries_ibfk_67` FOREIGN KEY (`delivered_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveries`
--

LOCK TABLES `deliveries` WRITE;
/*!40000 ALTER TABLE `deliveries` DISABLE KEYS */;
INSERT INTO `deliveries` VALUES (2,2,5,NULL,'2026-08-29 03:51:11','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 85% historical delivery success rate, currently available.',0,'2026-08-29 03:58:39','Melina Poudel',NULL,5,NULL,'2026-08-29 03:51:11','2026-08-29 03:58:39'),(3,3,6,NULL,'2026-08-29 03:55:03','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 85% historical delivery success rate, currently available.',0,'2026-08-29 03:59:53','Rohini Limbu','Sister taken the delivery',6,NULL,'2026-08-29 03:55:03','2026-08-29 03:59:53'),(4,4,7,NULL,'2026-08-29 03:56:54','Delivered','Auto','Recommended because Staff  has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 85% historical delivery success rate, currently available.',0,'2026-09-08 06:11:20','Sister',NULL,7,'2026-08-30','2026-08-29 03:56:54','2026-09-08 06:11:20'),(5,5,5,NULL,'2026-08-30 11:23:49','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-08-30 11:24:59','Ritika Shrestha','Mother received it',5,NULL,'2026-08-30 11:23:49','2026-08-30 11:24:59'),(6,6,5,NULL,'2026-08-31 05:47:53','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-08-31 05:50:10','Arjun Shah',NULL,5,NULL,'2026-08-31 05:47:53','2026-08-31 05:50:10'),(7,7,5,NULL,'2026-09-01 07:21:23','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:10:33','Rina Shrestha',NULL,5,NULL,'2026-09-01 07:21:23','2026-09-08 06:10:33'),(8,8,6,NULL,'2026-09-01 07:35:26','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-01 12:50:13','Mishika Shrestha',NULL,6,NULL,'2026-09-01 07:35:26','2026-09-01 12:50:13'),(9,9,6,NULL,'2026-09-08 06:08:00','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:11:48','Ritika Thakur',NULL,6,NULL,'2026-09-08 06:08:00','2026-09-08 06:11:48'),(10,10,6,NULL,'2026-09-08 06:09:52','Delivered','Auto','Recommended because Soichchha Khadka has 1 active parcel (lowest or near-lowest workload), about 7.5 km from their last active delivery, 67% historical delivery success rate, currently available.',1,'2026-09-08 06:12:14','Maya Thapa (Mother)',NULL,6,NULL,'2026-09-08 06:09:52','2026-09-08 06:12:14'),(11,11,5,NULL,'2026-09-08 06:16:04','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:17:52','Ashok Shrestha',NULL,5,NULL,'2026-09-08 06:16:04','2026-09-08 06:17:52'),(12,12,6,NULL,'2026-09-08 06:17:27','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:18:40','Shreeya Singh',NULL,6,NULL,'2026-09-08 06:17:27','2026-09-08 06:18:40'),(13,13,5,NULL,'2026-09-08 06:20:54','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:23:13','Mia Rana',NULL,5,NULL,'2026-09-08 06:20:54','2026-09-08 06:23:13'),(14,14,6,NULL,'2026-09-08 06:22:03','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:23:40','Rina Pradhan',NULL,6,NULL,'2026-09-08 06:22:03','2026-09-08 06:23:40'),(15,15,5,NULL,'2026-09-08 06:25:56','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:28:08','Shikshya Poudel',NULL,5,NULL,'2026-09-08 06:25:56','2026-09-08 06:28:08'),(16,16,6,NULL,'2026-09-08 06:27:10','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:28:33','Riya Sharma',NULL,6,NULL,'2026-09-08 06:27:10','2026-09-08 06:28:33'),(17,17,5,NULL,'2026-09-08 06:30:24','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-08 06:30:46','Nikki Tamang',NULL,5,NULL,'2026-09-08 06:30:24','2026-09-08 06:30:46'),(18,18,5,NULL,'2026-09-21 09:14:17','Delivered','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-21 09:18:31','Rina Thapa',NULL,5,NULL,'2026-09-21 09:14:17','2026-09-21 09:18:31'),(21,21,5,NULL,'2026-09-24 13:57:07','Assigned','Auto','Recommended because Bibusa Shrestha has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,NULL,NULL,NULL,NULL,NULL,'2026-09-24 13:57:07','2026-09-24 13:57:07'),(22,22,6,NULL,'2026-09-25 05:07:48','Delivered','Auto','Recommended because Soichchha Khadka has 0 active parcels (lowest or near-lowest workload), no active delivery, so available near the depot, 100% historical delivery success rate, currently available.',0,'2026-09-25 05:10:45','Shyam',NULL,6,NULL,'2026-09-25 05:07:48','2026-09-25 05:10:45');
/*!40000 ALTER TABLE `deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_attempts`
--

DROP TABLE IF EXISTS `delivery_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delivery_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parcel_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `reason` enum('Receiver unavailable','Wrong address','Phone unreachable','Customer requested reschedule','Other') NOT NULL,
  `remarks` text DEFAULT NULL,
  `attempted_at` datetime NOT NULL,
  `next_delivery_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `parcel_id` (`parcel_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `delivery_attempts_ibfk_31` FOREIGN KEY (`parcel_id`) REFERENCES `parcels` (`parcel_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `delivery_attempts_ibfk_32` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_attempts`
--

LOCK TABLES `delivery_attempts` WRITE;
/*!40000 ALTER TABLE `delivery_attempts` DISABLE KEYS */;
INSERT INTO `delivery_attempts` VALUES (1,4,7,'Customer requested reschedule','Reschedule delivery for next week','2026-08-29 04:00:59','2026-08-30','2026-08-29 04:00:59','2026-08-29 04:00:59');
/*!40000 ALTER TABLE `delivery_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedbacks` (
  `feedback_id` int(11) NOT NULL AUTO_INCREMENT,
  `parcel_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`feedback_id`),
  UNIQUE KEY `parcel_id` (`parcel_id`),
  KEY `customer_id` (`customer_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `feedbacks_ibfk_49` FOREIGN KEY (`parcel_id`) REFERENCES `parcels` (`parcel_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `feedbacks_ibfk_50` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `feedbacks_ibfk_51` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
INSERT INTO `feedbacks` VALUES (1,3,8,6,3,'Quick Delivery',NULL,'2026-08-29 04:01:40','2026-08-29 04:01:40'),(2,2,10,5,5,'Fast delivery',NULL,'2026-08-29 04:02:36','2026-08-29 04:02:36'),(3,8,11,6,5,'Fast Delivery',NULL,'2026-09-01 12:50:46','2026-09-01 12:50:46'),(4,11,13,5,5,NULL,NULL,'2026-09-08 06:18:16','2026-09-08 06:18:16'),(5,12,13,6,5,NULL,NULL,'2026-09-08 06:18:59','2026-09-08 06:18:59'),(6,14,14,6,3,NULL,NULL,'2026-09-08 06:24:13','2026-09-08 06:24:13'),(7,13,14,5,4,NULL,NULL,'2026-09-08 06:24:19','2026-09-08 06:24:19'),(8,17,14,5,5,NULL,NULL,'2026-09-08 06:31:05','2026-09-08 06:31:05'),(9,22,12,6,5,'fast ',NULL,'2026-09-25 05:11:38','2026-09-25 05:11:38');
/*!40000 ALTER TABLE `feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL AUTO_INCREMENT,
  `province` varchar(255) NOT NULL,
  `district` varchar(255) NOT NULL,
  `city_or_area` varchar(255) NOT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `full_address` text DEFAULT NULL,
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (13,'Nepal','Bagamati Province','Kathmandu',27.7451,85.3992,'Gokarneshwar Municipality, Kathmandu, Bagamati Province, Nepal'),(14,'Nepal','Bagamati Province','Kathmandu',27.6876,85.2482,'Chandragiri Municipality, Kathmandu, Bagamati Province, 44619, Nepal'),(15,'Nepal','Kathmandu','Shankharapur',27.7307,85.4662,'Shankharapur, Kathmandu, Bagamati Province, Nepal'),(16,'Nepal','Dang','Unknown',27.8797,82.4484,'Janakpur, Lamahi-07, Lamahi, Dang, Lumbini Province, Nepal'),(17,'Nepal','Bagamati Province','Kathmandu Metropolitan City',27.7126,85.2983,'Kathmandu Metropolitan City, Kathmandu, Bagamati Province, Nepal'),(18,'Nepal','Bagamati Province','Bhaktapur',27.6985,85.3946,'Madhyapur Thimi Municipality, Bhaktapur, Bagamati Province, Nepal'),(19,'Nepal','Bagamati Province','Kathmandu',27.7453,85.2543,'Nagarjun Municipality, Kathmandu, Bagamati Province, 44601, Nepal'),(20,'Nepal','Bagamati Province','Dhading',27.7476,85.2588,'Dhunibesi, Dhading, Bagamati Province, Nepal'),(21,'Nepal','Bagamati Province','Bhaktapur',27.6714,85.3953,'Suryabinayak Municipality, Bhaktapur, Bagamati Province, 89130, Nepal'),(22,'Nepal','Bhojpur','Phedi',27.4068,86.979,'Phedi, Salpasilichho, Bhojpur, Koshi Province, Nepal'),(23,'Nepal','Kathmandu','Kirtipur',27.6816,85.2731,'Dev Dhoka, Kirtipur-02, Kirtipur, Kirtipur Municipality, Kathmandu, Bagamati Province, 44618, Nepal'),(24,'Nepal','Kathmandu','Shankharapur',27.7308,85.466,'Ilaka Administration Office Sankhu, Sali Nadi Road, Pukhulachhi, Shankharapur-07, Shankharapur, Kathmandu, Bagamati Province, 44603, Nepal'),(25,'Nepal','Ilam District','Unknown',26.9253,87.9206,'Illam-06, Ilam, Ilam District, Koshi Province, 57300, Nepal'),(26,'Nepal','Bagamati Province','Kathmandu',27.7602,85.3328,'Tokha Municipality, Kathmandu, Bagamati Province, 44608, Nepal'),(27,'Nepal','Bagamati Province','Lalitpur',27.6692,85.332,'Lalitpur, Lalitpur Metropolitan City, Lalitpur, Bagamati Province, 44707, Nepal'),(28,'Nepal','Bagamati Province','Kathmandu',27.7104,85.3792,'Kageshwori Manohara Municipality, Kathmandu, Bagamati Province, Nepal'),(29,'Nepal','Chitwan','Unknown',27.6181,84.4536,'Chitwan, Bagamati Province, Nepal');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parcels`
--

DROP TABLE IF EXISTS `parcels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `parcels` (
  `parcel_id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `source_location_id` int(11) NOT NULL,
  `destination_location_id` int(11) NOT NULL,
  `weight` float DEFAULT 1,
  `delivery_type` enum('Air','Vehicle') DEFAULT 'Vehicle',
  `priority` enum('Standard','Express') DEFAULT 'Standard',
  `predicted_delivery_hours` float DEFAULT NULL,
  `prediction_source` varchar(255) DEFAULT NULL,
  `total_cost` float DEFAULT 0,
  `parcel_status` enum('Booked','Assigned','Picked Up','In Transit','Out for Delivery','Delivery Attempt Failed','Rescheduled','Delivered','Cancelled') DEFAULT 'Booked',
  `booking_date` datetime DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `receiver_phone` varchar(255) NOT NULL,
  `tracking_hash` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`parcel_id`),
  UNIQUE KEY `tracking_hash` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_2` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_3` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_4` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_5` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_6` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_7` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_8` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_9` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_10` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_11` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_12` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_13` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_14` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_15` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_16` (`tracking_hash`),
  UNIQUE KEY `tracking_hash_17` (`tracking_hash`),
  KEY `client_id` (`client_id`),
  KEY `source_location_id` (`source_location_id`),
  KEY `destination_location_id` (`destination_location_id`),
  CONSTRAINT `parcels_ibfk_49` FOREIGN KEY (`client_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `parcels_ibfk_50` FOREIGN KEY (`source_location_id`) REFERENCES `locations` (`location_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `parcels_ibfk_51` FOREIGN KEY (`destination_location_id`) REFERENCES `locations` (`location_id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parcels`
--

LOCK TABLES `parcels` WRITE;
/*!40000 ALTER TABLE `parcels` DISABLE KEYS */;
INSERT INTO `parcels` VALUES (2,10,13,14,21,'Vehicle','Standard',24,'fallback',172,'Delivered','2026-08-29 03:51:11','Choclates','Melina Poudel','9812365788','TRK-404885','2026-08-29 03:51:11','2026-08-29 03:58:39'),(3,8,15,16,10,'Air','Express',17,'fallback',795,'Delivered','2026-08-29 03:55:03','Cosmetics','Ruja Limbu','9812456545','TRK-785344','2026-08-29 03:55:03','2026-08-29 03:59:53'),(4,9,17,18,25.7,'Vehicle','Standard',24,'fallback',209,'Delivered','2026-08-29 03:56:54','Books','Aditi Dahal','9854323456','TRK-640917','2026-08-29 03:56:54','2026-09-08 06:11:20'),(5,8,19,18,5.6,'Vehicle','Standard',24,'fallback',93,'Delivered','2026-08-30 11:23:49','Bag','Ellie Subba','9812365788','TRK-192972','2026-08-30 11:23:49','2026-08-30 11:24:59'),(6,8,19,18,185.9,'Vehicle','Express',17,'fallback',995,'Delivered','2026-08-31 05:47:53','Accessories','Arjun Shah','9878767876','TRK-237032','2026-08-31 05:47:53','2026-08-31 05:50:10'),(7,8,20,18,139.2,'Vehicle','Express',17,'fallback',761,'Delivered','2026-09-01 07:21:23','Accessories','Binisha Shrestha ','9812321212','TRK-951930','2026-09-01 07:21:23','2026-09-08 06:10:33'),(8,11,20,21,189,'Vehicle','Standard',24,'fallback',1011,'Delivered','2026-09-01 07:35:26','Books','Saniya Luitel','9812345654','TRK-537463','2026-09-01 07:35:26','2026-09-01 12:50:13'),(9,12,22,23,138.6,'Air','Standard',24,'fallback',1185,'Delivered','2026-09-08 06:08:00','Accessories','Ritika Thakur','9812345432','TRK-796315','2026-09-08 06:08:00','2026-09-08 06:11:48'),(10,12,20,18,48.6,'Vehicle','Standard',24,'fallback',328,'Delivered','2026-09-08 06:09:52','Bags','Melisha Thapa','9876787667','TRK-127829','2026-09-08 06:09:52','2026-09-08 06:12:14'),(11,13,24,25,38,'Air','Standard',24,'fallback',857,'Delivered','2026-09-08 06:16:04','Camera','Ashok Shrestha','9812342542','TRK-125553','2026-09-08 06:16:04','2026-09-08 06:17:52'),(12,13,26,27,151,'Vehicle','Standard',24,'fallback',836,'Delivered','2026-09-08 06:17:27','Cosmetics','Rupali Singh','9812343444','TRK-218866','2026-09-08 06:17:27','2026-09-08 06:18:40'),(13,14,19,13,21,'Vehicle','Standard',24,'fallback',170,'Delivered','2026-09-08 06:20:54','Computer','Mia Rana','9876767543','TRK-777729','2026-09-08 06:20:54','2026-09-08 06:23:13'),(14,14,20,18,12,'Vehicle','Standard',24,'fallback',125,'Delivered','2026-09-08 06:22:03','Speaker','Rijan Man Pradhan','9812321234','TRK-349651','2026-09-08 06:22:03','2026-09-08 06:23:40'),(15,11,20,21,1,'Vehicle','Standard',24,'fallback',71,'Delivered','2026-09-08 06:25:56','Clothes','Shikshya Poudel','9876578976','TRK-348426','2026-09-08 06:25:56','2026-09-08 06:28:08'),(16,11,14,13,12,'Vehicle','Standard',24,'fallback',127,'Delivered','2026-09-08 06:27:10','Choclates','Nisha Sharma','9812321234','TRK-198629','2026-09-08 06:27:10','2026-09-08 06:28:33'),(17,14,20,18,21,'Vehicle','Standard',15.7,'ml',190,'Delivered','2026-09-08 06:30:24','Video game','Nikki Tamang','9878987678','TRK-778789','2026-09-08 06:30:24','2026-09-08 06:30:46'),(18,8,20,18,5,'Vehicle','Standard',3.6,'ml',90,'Delivered','2026-09-21 09:14:17','Medicine','Emma Thapa','9878789876','TRK-221084','2026-09-21 09:14:17','2026-09-21 09:18:31'),(21,8,19,28,17,'Vehicle','Express',35.4,'ml',148,'Assigned','2026-09-24 13:57:07','Medicine','Bibusa Shrestha','9812345444','TRK-819557','2026-09-24 13:57:07','2026-09-24 13:57:07'),(22,12,29,17,9.6,'Vehicle','Standard',1,'ml',202,'Delivered','2026-09-25 05:07:48','Cosmetics','Shyam','9812345432','TRK-574039','2026-09-25 05:07:48','2026-09-25 05:10:45');
/*!40000 ALTER TABLE `parcels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `parcel_id` int(11) NOT NULL,
  `amount` float NOT NULL,
  `payment_method` enum('eSewa','COD') DEFAULT 'eSewa',
  `transaction_reference` varchar(255) DEFAULT NULL,
  `payment_status` enum('Pending','Completed','Failed') DEFAULT 'Pending',
  `payment_date` datetime DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `parcel_id` (`parcel_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`parcel_id`) REFERENCES `parcels` (`parcel_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (2,2,172,'eSewa','000GWWG','Completed','2026-08-29 03:51:11'),(3,3,795,'eSewa','000GWWI','Completed','2026-08-29 03:55:03'),(4,4,209,'COD',NULL,'Completed','2026-08-29 03:56:54'),(5,5,93,'eSewa','000GXBD','Completed','2026-08-30 11:23:49'),(6,6,995,'eSewa','000GXJ7','Completed','2026-08-31 05:47:53'),(7,7,761,'eSewa','000GXYB','Completed','2026-09-01 07:21:23'),(8,8,1011,'eSewa','000GXYH','Completed','2026-09-01 07:35:26'),(9,9,1185,'eSewa','000H0K7','Completed','2026-09-08 06:08:00'),(10,10,328,'COD',NULL,'Completed','2026-09-08 06:09:52'),(11,11,857,'eSewa','000H0KD','Completed','2026-09-08 06:16:04'),(12,12,836,'COD',NULL,'Completed','2026-09-08 06:17:27'),(13,13,170,'eSewa','000H0KG','Completed','2026-09-08 06:20:54'),(14,14,125,'eSewa','000H0KI','Completed','2026-09-08 06:22:03'),(15,15,71,'eSewa','000H0KN','Completed','2026-09-08 06:25:56'),(16,16,127,'eSewa','000H0KQ','Completed','2026-09-08 06:27:10'),(17,17,190,'COD',NULL,'Completed','2026-09-08 06:30:24'),(18,18,90,'eSewa',NULL,'Completed','2026-09-21 09:14:17'),(21,21,148,'eSewa','000H6RZ','Completed','2026-09-24 13:57:07'),(22,22,202,'COD',NULL,'Completed','2026-09-25 05:07:48');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tracking_history`
--

DROP TABLE IF EXISTS `tracking_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tracking_history` (
  `tracking_id` int(11) NOT NULL AUTO_INCREMENT,
  `parcel_id` int(11) NOT NULL,
  `current_location_id` int(11) DEFAULT NULL,
  `status_message` varchar(255) NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`tracking_id`),
  KEY `parcel_id` (`parcel_id`),
  KEY `current_location_id` (`current_location_id`),
  CONSTRAINT `tracking_history_ibfk_33` FOREIGN KEY (`parcel_id`) REFERENCES `parcels` (`parcel_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tracking_history_ibfk_34` FOREIGN KEY (`current_location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracking_history`
--

LOCK TABLES `tracking_history` WRITE;
/*!40000 ALTER TABLE `tracking_history` DISABLE KEYS */;
INSERT INTO `tracking_history` VALUES (2,2,13,'Parcel Booked','2026-08-29 03:51:11'),(3,3,15,'Parcel Booked','2026-08-29 03:55:03'),(4,4,17,'Parcel Booked','2026-08-29 03:56:54'),(5,2,NULL,'Status updated to Picked Up','2026-08-29 03:57:37'),(6,2,NULL,'Status updated to In Transit','2026-08-29 03:57:43'),(7,2,NULL,'Status updated to Out for Delivery','2026-08-29 03:57:45'),(8,2,NULL,'Delivered to Melina Poudel','2026-08-29 03:58:39'),(9,3,NULL,'Status updated to Picked Up','2026-08-29 03:58:59'),(10,3,NULL,'Status updated to In Transit','2026-08-29 03:59:01'),(11,3,NULL,'Status updated to Out for Delivery','2026-08-29 03:59:01'),(12,3,NULL,'Delivered to Rohini Limbu','2026-08-29 03:59:53'),(13,4,NULL,'Status updated to Picked Up','2026-08-29 04:00:06'),(14,4,NULL,'Status updated to In Transit','2026-08-29 04:00:07'),(15,4,NULL,'Status updated to Out for Delivery','2026-08-29 04:00:08'),(16,4,NULL,'Delivery Attempt: Customer requested reschedule','2026-08-29 04:00:59'),(17,4,NULL,'Rescheduled - New delivery date: 2026-08-30','2026-08-29 04:00:59'),(18,5,19,'Parcel Booked','2026-08-30 11:23:49'),(19,5,NULL,'Status updated to Picked Up','2026-08-30 11:24:34'),(20,5,NULL,'Status updated to In Transit','2026-08-30 11:24:36'),(21,5,NULL,'Status updated to Out for Delivery','2026-08-30 11:24:38'),(22,5,NULL,'Delivered to Ritika Shrestha','2026-08-30 11:24:59'),(23,6,19,'Parcel Booked','2026-08-31 05:47:53'),(24,6,NULL,'Status updated to Picked Up','2026-08-31 05:49:58'),(25,6,NULL,'Status updated to In Transit','2026-08-31 05:49:58'),(26,6,NULL,'Status updated to Out for Delivery','2026-08-31 05:49:58'),(27,6,NULL,'Delivered to Arjun Shah','2026-08-31 05:50:10'),(28,7,20,'Parcel Booked','2026-09-01 07:21:23'),(29,7,NULL,'Status updated to Picked Up','2026-09-01 07:22:38'),(30,7,NULL,'Status updated to In Transit','2026-09-01 07:22:39'),(31,8,20,'Parcel Booked','2026-09-01 07:35:26'),(32,8,NULL,'Status updated to Picked Up','2026-09-01 12:46:58'),(33,8,NULL,'Status updated to In Transit','2026-09-01 12:49:50'),(34,8,NULL,'Status updated to Out for Delivery','2026-09-01 12:49:50'),(35,8,NULL,'Delivered to Mishika Shrestha','2026-09-01 12:50:13'),(36,9,22,'Parcel Booked','2026-09-08 06:08:00'),(37,10,20,'Parcel Booked','2026-09-08 06:09:52'),(38,7,NULL,'Status updated to Out for Delivery','2026-09-08 06:10:15'),(39,7,NULL,'Delivered to Rina Shrestha','2026-09-08 06:10:33'),(40,4,NULL,'Status updated to Out for Delivery','2026-09-08 06:11:08'),(41,4,NULL,'Delivered to Sister','2026-09-08 06:11:20'),(42,9,NULL,'Status updated to Picked Up','2026-09-08 06:11:32'),(43,9,NULL,'Status updated to In Transit','2026-09-08 06:11:33'),(44,9,NULL,'Status updated to Out for Delivery','2026-09-08 06:11:33'),(45,9,NULL,'Delivered to Ritika Thakur','2026-09-08 06:11:48'),(46,10,NULL,'Status updated to Picked Up','2026-09-08 06:11:51'),(47,10,NULL,'Status updated to In Transit','2026-09-08 06:11:51'),(48,10,NULL,'Status updated to Out for Delivery','2026-09-08 06:11:52'),(49,10,NULL,'Delivered to Maya Thapa (Mother)','2026-09-08 06:12:14'),(50,11,24,'Parcel Booked','2026-09-08 06:16:04'),(51,12,26,'Parcel Booked','2026-09-08 06:17:27'),(52,11,NULL,'Status updated to Picked Up','2026-09-08 06:17:40'),(53,11,NULL,'Status updated to In Transit','2026-09-08 06:17:41'),(54,11,NULL,'Status updated to Out for Delivery','2026-09-08 06:17:41'),(55,11,NULL,'Delivered to Ashok Shrestha','2026-09-08 06:17:52'),(56,12,NULL,'Status updated to Picked Up','2026-09-08 06:18:31'),(57,12,NULL,'Status updated to In Transit','2026-09-08 06:18:31'),(58,12,NULL,'Status updated to Out for Delivery','2026-09-08 06:18:31'),(59,12,NULL,'Delivered to Shreeya Singh','2026-09-08 06:18:40'),(60,13,19,'Parcel Booked','2026-09-08 06:20:54'),(61,14,20,'Parcel Booked','2026-09-08 06:22:03'),(62,13,NULL,'Status updated to Picked Up','2026-09-08 06:23:05'),(63,13,NULL,'Status updated to In Transit','2026-09-08 06:23:06'),(64,13,NULL,'Status updated to Out for Delivery','2026-09-08 06:23:06'),(65,13,NULL,'Delivered to Mia Rana','2026-09-08 06:23:13'),(66,14,NULL,'Status updated to Picked Up','2026-09-08 06:23:29'),(67,14,NULL,'Status updated to In Transit','2026-09-08 06:23:29'),(68,14,NULL,'Status updated to Out for Delivery','2026-09-08 06:23:29'),(69,14,NULL,'Delivered to Rina Pradhan','2026-09-08 06:23:40'),(70,15,20,'Parcel Booked','2026-09-08 06:25:56'),(71,16,14,'Parcel Booked','2026-09-08 06:27:10'),(72,15,NULL,'Status updated to Picked Up','2026-09-08 06:27:59'),(73,15,NULL,'Status updated to In Transit','2026-09-08 06:27:59'),(74,15,NULL,'Status updated to Out for Delivery','2026-09-08 06:27:59'),(75,15,NULL,'Delivered to Shikshya Poudel','2026-09-08 06:28:08'),(76,16,NULL,'Status updated to Picked Up','2026-09-08 06:28:22'),(77,16,NULL,'Status updated to In Transit','2026-09-08 06:28:22'),(78,16,NULL,'Status updated to Out for Delivery','2026-09-08 06:28:22'),(79,16,NULL,'Delivered to Riya Sharma','2026-09-08 06:28:33'),(80,17,20,'Parcel Booked','2026-09-08 06:30:24'),(81,17,NULL,'Status updated to Picked Up','2026-09-08 06:30:38'),(82,17,NULL,'Status updated to In Transit','2026-09-08 06:30:38'),(83,17,NULL,'Status updated to Out for Delivery','2026-09-08 06:30:38'),(84,17,NULL,'Delivered to Nikki Tamang','2026-09-08 06:30:46'),(85,18,20,'Parcel Booked','2026-09-21 09:14:17'),(88,18,NULL,'Status updated to Picked Up','2026-09-21 09:18:22'),(89,18,NULL,'Status updated to In Transit','2026-09-21 09:18:22'),(90,18,NULL,'Status updated to Out for Delivery','2026-09-21 09:18:22'),(91,18,NULL,'Delivered to Rina Thapa','2026-09-21 09:18:31'),(92,21,19,'Parcel Booked','2026-09-24 13:57:07'),(93,22,29,'Parcel Booked','2026-09-25 05:07:48'),(94,22,NULL,'Status updated to Picked Up','2026-09-25 05:10:08'),(95,22,NULL,'Status updated to In Transit','2026-09-25 05:10:11'),(96,22,NULL,'Status updated to Out for Delivery','2026-09-25 05:10:13'),(97,22,NULL,'Delivered to Shyam','2026-09-25 05:10:45');
/*!40000 ALTER TABLE `tracking_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('client','staff','admin') DEFAULT 'client',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,'Admin','admin@quickship.com','9800000000','$2a$10$Uhmct6KGJ9DdR.cQDYWBduNSo0Yc6R.5eQLxKsyD9NseVwnifwCTe','admin','2026-08-29 03:44:10','2026-09-25 05:03:27'),(5,'Bibusa Shrestha','bibusa@quickship.com','9812334678','$2a$10$KgauLDh9fvPjxmDoiSXwcO3bnTB/BRL.5ncjiO/zfWh0s77ViPnOC','staff','2026-08-29 03:45:43','2026-08-29 03:45:43'),(6,'Soichchha Khadka','soichchha@quickship.com','9876544345','$2a$10$ZA8C.YA/yIKGoiO3M6m7IenXuAsl1HriJhH23hvypUS3.y2kH2rJW','staff','2026-08-29 03:46:16','2026-08-29 03:46:16'),(7,'Staff ','staff@quickship.com','9871234565','$2a$10$TMZRBOd8wpD3W/d2pYfOzOTICOvwI3kZwQUKfY9.to3cpd0oOZJGC','staff','2026-08-29 03:47:31','2026-08-29 03:47:31'),(8,'Anju Shrestha','anjushrestha@gmail.com','9812343212','$2a$10$.TPw3HhRtUpWPnysY8ObsO3L3kshMARQ.gicVKG71TkyFC0HQuORW','client','2026-08-29 03:48:39','2026-08-29 03:48:39'),(9,'Manita Shah','shahmanita@gmail.com','9876765676','$2a$10$OhAvBL5pkEg79naLjnV/teqZTFoQiTZTp9knlYM7fxtMgU/dlYtMa','client','2026-08-29 03:49:25','2026-08-29 03:49:25'),(10,'Lisa Rai','rlisa@gmail.com','9812541254','$2a$10$RLdfVIXLL64tO2FABolGxOS40imnTXiuWRzL3PyBOHsYiACFkgYF.','client','2026-08-29 03:49:58','2026-08-29 03:49:58'),(11,'Bibusa Shrestha','sbibusa@gmail.com','9809890765','$2a$10$bqyubu0Kn5muRkaYewEtJ.yju5tLLIgxCxhZjrq1oq7dawibpd.aa','client','2026-09-01 07:33:43','2026-09-01 07:33:43'),(12,'Kritika Shrestha','skritika@gmail.com','9812321212','$2a$10$lEwAAEcbavPL8padnSWzv.E2muYZIcRNVM6AK21oImW2KTKoupyYG','client','2026-09-08 06:06:02','2026-09-08 06:06:02'),(13,'Ruja Shrestha','ruja@gmail.com','9812321234','$2a$10$pocoWcyujASkzhbKzBTWmuF762JsdewEwQc5DnBqvJto2DAK83/9e','client','2026-09-08 06:14:15','2026-09-08 06:14:15'),(14,'Riya Pradhan','riya@gmail.com','9812345555','$2a$10$6U6ZRXlxQKV6H9o.tbckauwihKoZGEgruhT.MpREpJ5lfX3cwr8fu','client','2026-09-08 06:19:40','2026-09-08 06:19:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'quickship'
--

--
-- Dumping routines for database 'quickship'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-01 13:38:58
