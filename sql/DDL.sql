-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema TicketSystem
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema TicketSystem
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `TicketSystem` DEFAULT CHARACTER SET utf8mb4 ;
USE `TicketSystem` ;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Tickets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Tickets` ;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NULL,
  `category_id` INT NULL,
  `agent_id` VARCHAR(45) NULL,
  `agent_name` VARCHAR(100) NULL,
  `agent_email` VARCHAR(100) NULL,
  `author_id` VARCHAR(45) NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `author_email` VARCHAR(100) NOT NULL,
  `description` VARCHAR(5000) NULL,
  `opened_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  `reopen_requested` BOOLEAN DEFAULT FALSE,
  `unread_agent` BOOLEAN DEFAULT FALSE,
  `unread_user` BOOLEAN DEFAULT FALSE,
  `notification_sent` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`),
    FOREIGN KEY (`category_id`)
    REFERENCES `TicketSystem`.`Categories` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Requests_reopen_ticket`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Requests_reopen_ticket`;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Requests_reopen_ticket` (
  `ticket_id` INT NOT NULL,
  PRIMARY KEY (`ticket_id`),
  FOREIGN KEY (`ticket_id`)
    REFERENCES `TicketSystem`.`Tickets` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Requests_create_user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Requests_create_user` ;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Requests_create_user` (
  `user_email` VARCHAR(100) NOT NULL,
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  PRIMARY KEY (`user_email`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Categories`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Categories` ;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Logs` ;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Logs` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `ticket_id` INT NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `comment` VARCHAR(2000) NOT NULL,
  `author` VARCHAR(50),
  `author_role` VARCHAR(50),
  PRIMARY KEY (`log_id`),
    FOREIGN KEY (`ticket_id`)
    REFERENCES `TicketSystem`.`Tickets` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Ticket_files`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Ticket_files` ;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Ticket_files` (
  `file_id` INT NOT NULL AUTO_INCREMENT,
  `path` VARCHAR(200) NOT NULL,
  `ticket_id` INT NOT NULL,
  PRIMARY KEY (`file_id`),
    FOREIGN KEY (`ticket_id`)
    REFERENCES `TicketSystem`.`Tickets` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `TicketSystem`.`Knowledge_board`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `TicketSystem`.`Knowledge_board` ;

CREATE TABLE IF NOT EXISTS `TicketSystem`.`Knowledge_board` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `author_name` VARCHAR(100) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `content` VARCHAR(3000) NOT NULL,
  `category` INT NULL,
  PRIMARY KEY (`id`),
    FOREIGN KEY (`category`)
    REFERENCES `TicketSystem`.`Categories` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


--
-- VIEWS
--

DROP VIEW IF EXISTS v_tickets;

CREATE VIEW v_tickets AS 
    SELECT 
        t.id,
        t.title,
        c.name AS category_name,
        DATE_FORMAT(t.opened_at, '%Y-%m-%d %H:%i:%s') AS formatted_opened_at,
        opened_at,
        DATE_FORMAT(t.updated_at, '%Y-%m-%d %H:%i:%s') AS formatted_updated_at,
        t.updated_at,
        DATE_FORMAT(t.closed_at, '%Y-%m-%d %H:%i:%s') AS formatted_closed_at,
        closed_at,
        t.description,
        t.author_id,
        t.author_name,
        t.author_email,
        t.agent_id,
        t.agent_name,
        t.agent_email,
        t.reopen_requested,
        t.unread_agent,
        t.unread_user,
        t.notification_sent
    FROM 
        Tickets AS t
    LEFT JOIN 
        Categories AS c
    ON
        c.id = t.category_id;


DROP VIEW IF EXISTS v_logs;

CREATE VIEW v_logs AS 
    SELECT
      ticket_id,
      log_id,
      author,
      author_role,
      comment,
      DATE_FORMAT(`timestamp`, '%Y-%m-%d %H:%i:%s') AS formatted_timestamp
    FROM
      Logs;


DROP VIEW IF EXISTS v_requests_create_user;

CREATE VIEW v_requests_create_user AS 
    SELECT
      user_email,
      DATE_FORMAT(`requested_at`, '%Y-%m-%d %H:%i:%s') AS formatted_requested_at
    FROM
      Requests_create_user;


DROP VIEW IF EXISTS v_requests_reopen_ticket;

CREATE VIEW v_requests_reopen_ticket AS 
    SELECT
        r.ticket_id,
        t.agent_id,
        t.author_name
    FROM
        Requests_reopen_ticket AS r
    LEFT JOIN
        Tickets AS t
    ON
        r.ticket_id = t.id;


DROP VIEW IF EXISTS v_knowledge_board;

CREATE VIEW v_knowledge_board AS 
    SELECT
        k.id,
        k.author_name,
        k.content,
        c.name as category,
        DATE_FORMAT(k.timestamp, '%Y-%m-%d %H:%i:%s') AS formatted_timestamp
    FROM
        Knowledge_board as k
    LEFT JOIN
        Categories as c
    ON
        k.category = c.id;


--
-- TRIGGERS
--

DELIMITER ;;
CREATE TRIGGER update_ticket_timestamp
AFTER INSERT ON Logs
FOR EACH ROW
BEGIN
    UPDATE Tickets
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.ticket_id;
END;;
DELIMITER ;


DELIMITER ;;
CREATE TRIGGER update_ticket
BEFORE UPDATE ON Tickets
FOR EACH ROW
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        SET NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
END;;
DELIMITER ;


--
-- PROCEDURES
--

DROP PROCEDURE IF EXISTS get_tickets;
DELIMITER ;;
CREATE PROCEDURE get_tickets()
BEGIN
  SELECT * FROM v_tickets;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_open_tickets;
DELIMITER ;;
CREATE PROCEDURE get_open_tickets()
BEGIN
  SELECT * FROM v_tickets WHERE closed_at IS NULL;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_tickets_notification;
DELIMITER ;;
CREATE PROCEDURE get_tickets_notification()
BEGIN
  SELECT * FROM v_tickets WHERE notification_sent = TRUE;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_tickets_user_id;
DELIMITER ;;
CREATE PROCEDURE get_tickets_user_id(p_id VARCHAR(45))
BEGIN
  SELECT * FROM v_tickets WHERE author_id = p_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_tickets_ticket_id;
DELIMITER ;;
CREATE PROCEDURE get_tickets_ticket_id(p_id INT)
BEGIN
  SELECT * FROM v_tickets WHERE id = p_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS create_ticket;
DELIMITER ;;
CREATE PROCEDURE create_ticket(p_title VARCHAR(200), p_author_id VARCHAR(45), p_author_email VARCHAR(100), p_author_name VARCHAR(100), p_category_id INT, p_description VARCHAR(5000))
BEGIN
  INSERT INTO Tickets (title, author_id, author_email, author_name, category_id, description) VALUES (p_title, p_author_id, p_author_email, p_author_name, p_category_id, p_description);
  SELECT id FROM Tickets ORDER BY id DESC LIMIT 1;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS create_category;
DELIMITER ;;
CREATE PROCEDURE create_category(p_category_name VARCHAR(50))
BEGIN
  INSERT INTO Categories (name) VALUES (p_category_name);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS claim_ticket;
DELIMITER ;;
CREATE PROCEDURE claim_ticket(p_agent_id VARCHAR(45), p_agent_name VARCHAR(100), p_agent_email VARCHAR(100), p_ticket_id INT)
BEGIN
  UPDATE Tickets 
  SET agent_id = p_agent_id, agent_name = p_agent_name, agent_email = p_agent_email
  WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS upload_file_log;
DELIMITER ;;
CREATE PROCEDURE upload_file_log(p_log_id INT, p_file_path VARCHAR(200))
BEGIN
  INSERT INTO Logs (`path`, log_id) VALUES (p_file_path, p_log_id);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS upload_file_ticket;
DELIMITER ;;
CREATE PROCEDURE upload_file_ticket(p_ticket_id INT, p_file_path VARCHAR(200))
BEGIN
  INSERT INTO Logs (`path`, ticket_id) VALUES (p_file_path, p_ticket_id);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS close_ticket;
DELIMITER ;;
CREATE PROCEDURE close_ticket(p_ticket_id INT)
BEGIN
  UPDATE Tickets SET closed_at = CURRENT_TIMESTAMP WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_logs;
DELIMITER ;;
CREATE PROCEDURE get_logs(p_ticket_id INT)
BEGIN
  SELECT * FROM v_logs WHERE ticket_id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS new_comment;
DELIMITER ;;
CREATE PROCEDURE new_comment(p_ticket_id INT, p_author VARCHAR(50), p_comment VARCHAR(2000), p_role VARCHAR(50))
BEGIN
  INSERT INTO Logs(ticket_id, author, comment, author_role) VALUES (p_ticket_id, p_author, p_comment, p_role);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS set_unread_agent;
DELIMITER ;;
CREATE PROCEDURE set_unread_agent(p_ticket_id INT, p_event BOOLEAN)
BEGIN
  UPDATE Tickets SET unread_agent = p_event WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS set_unread_user;
DELIMITER ;;
CREATE PROCEDURE set_unread_user(p_ticket_id INT, p_event BOOLEAN)
BEGIN
  UPDATE Tickets SET unread_user = p_event WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS change_category;
DELIMITER ;;
CREATE PROCEDURE change_category(p_ticket_id INT, p_category_id VARCHAR(50))
BEGIN
  UPDATE Tickets SET category_id = p_category_id WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS new_system_log;
DELIMITER ;;
CREATE PROCEDURE new_system_log(p_ticket_id INT, p_comment VARCHAR(2000))
BEGIN
  INSERT INTO Logs(ticket_id, author, comment) VALUES (p_ticket_id, "System", p_comment);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS request_reopen_ticket;
DELIMITER ;;
CREATE PROCEDURE request_reopen_ticket(p_ticket_id INT)
BEGIN
  INSERT INTO Requests_reopen_ticket(ticket_id) VALUES (p_ticket_id);
  UPDATE Tickets SET reopen_requested = TRUE WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS accept_reopen_ticket;
DELIMITER ;;
CREATE PROCEDURE accept_reopen_ticket(p_ticket_id INT)
BEGIN
  UPDATE Tickets SET closed_at = NULL, reopen_requested = FALSE, agent_id = NULL, agent_email = NULL, agent_name = NULL WHERE id = p_ticket_id;
  DELETE FROM Requests_reopen_ticket WHERE ticket_id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS deny_reopen_ticket;
DELIMITER ;;
CREATE PROCEDURE deny_reopen_ticket(p_ticket_id INT)
BEGIN
  UPDATE Tickets SET reopen_requested = FALSE WHERE id = p_ticket_id;
  DELETE FROM Requests_reopen_ticket WHERE ticket_id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_requests_reopen_ticket;
DELIMITER ;;
CREATE PROCEDURE get_requests_reopen_ticket(p_agent_id VARCHAR(45))
BEGIN
  SELECT * FROM v_requests_reopen_ticket WHERE agent_id = p_agent_id;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS get_all_requests_reopen_ticket;
DELIMITER ;;
CREATE PROCEDURE get_all_requests_reopen_ticket()
BEGIN
  SELECT * FROM v_requests_reopen_ticket;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS request_create_user;
DELIMITER ;;
CREATE PROCEDURE request_create_user(p_user_email VARCHAR(100))
BEGIN
  INSERT INTO Requests_create_user (user_email) VALUES (p_user_email);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_requests_create_user;
DELIMITER ;;
CREATE PROCEDURE get_requests_create_user()
BEGIN
  SELECT * FROM v_requests_create_user;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS accept_create_user;
DELIMITER ;;
CREATE PROCEDURE accept_create_user(p_user_email VARCHAR(100))
BEGIN
  DELETE FROM Requests_create_user WHERE user_email = p_user_email;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS add_ticket_files;
DELIMITER ;;
CREATE PROCEDURE add_ticket_files(p_path VARCHAR(200), p_ticket_id INT)
BEGIN
  INSERT INTO Ticket_files(path, ticket_id) VALUES (p_path, p_ticket_id);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_ticket_files;
DELIMITER ;;
CREATE PROCEDURE get_ticket_files(p_ticket_id INT)
BEGIN
  SELECT path FROM Ticket_files WHERE ticket_id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS change_agent;
DELIMITER ;;
CREATE PROCEDURE change_agent(p_new_agent_name VARCHAR(100), p_new_agent_email VARCHAR(100), p_new_agent_id VARCHAR(45), p_ticket_id INT)
BEGIN
  UPDATE Tickets SET agent_name = p_new_agent_name, agent_email = p_new_agent_email, agent_id = p_new_agent_id WHERE id = p_ticket_id;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS new_knowledge_board_post;
DELIMITER ;;
CREATE PROCEDURE new_knowledge_board_post(p_author_name VARCHAR(100), p_content VARCHAR(3000), p_category INT)
BEGIN
  INSERT INTO Knowledge_board(author_name, content, category) VALUES (p_author_name, p_content, p_category);
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS get_knowledge_board_posts;
DELIMITER ;;
CREATE PROCEDURE get_knowledge_board_posts()
BEGIN
  SELECT * FROM v_knowledge_board;
END;;
DELIMITER ;


DROP PROCEDURE IF EXISTS delete_category;
DELIMITER ;;
CREATE PROCEDURE delete_category(p_id INT)
BEGIN
  UPDATE Tickets SET  category_id = NULL WHERE category_id = p_id;
  UPDATE Knowledge_board  SET category = NULL WHERE category = p_id;
  DELETE FROM Categories WHERE id = p_id;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS update_tickets_first_login;
DELIMITER ;;
CREATE PROCEDURE update_tickets_first_login(p_author_name VARCHAR(100), p_author_email VARCHAR(100), p_author_id VARCHAR(45))
BEGIN
  UPDATE Tickets SET author_name = p_author_name, author_id = p_author_id WHERE author_name = p_author_email;
END;;
DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;