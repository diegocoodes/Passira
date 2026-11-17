CREATE TABLE `CustomerAccount` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `CustomerAccount_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `CustomerSession` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    INDEX `CustomerSession_accountId_idx`(`accountId`),
    INDEX `CustomerSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `CustomerSession` ADD CONSTRAINT `CustomerSession_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `CustomerAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Order` ADD COLUMN `accountId` VARCHAR(191) NULL;
CREATE INDEX `Order_accountId_id_idx` ON `Order`(`accountId`, `id`);
ALTER TABLE `Order` ADD CONSTRAINT `Order_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `CustomerAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
