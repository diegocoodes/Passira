-- CreateTable
CREATE TABLE `SystemLog` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `level` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorEmail` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NULL,
    `details` JSON NOT NULL,

    INDEX `SystemLog_createdAt_id_idx`(`createdAt`, `id`),
    INDEX `SystemLog_category_createdAt_idx`(`category`, `createdAt`),
    INDEX `SystemLog_level_createdAt_idx`(`level`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
