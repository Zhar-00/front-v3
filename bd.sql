-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 13, 2026 at 05:16 PM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u348616500_sigesto`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`u348616500_sigesto`@`127.0.0.1` PROCEDURE `sp_recalcular_totales_cotizacion` (IN `p_id_cotizacion` BIGINT UNSIGNED)   BEGIN
                DECLARE v_subtotal DECIMAL(12,2);
                DECLARE v_tasa_igv DECIMAL(5,2);

                SELECT IFNULL(SUM(subtotal),0) INTO v_subtotal FROM detalle_cotizacion WHERE id_cotizacion = p_id_cotizacion;
                SELECT tasa_igv INTO v_tasa_igv FROM cotizaciones WHERE id_cotizacion = p_id_cotizacion;

                UPDATE cotizaciones
                SET subtotal = v_subtotal, igv = ROUND(v_subtotal * (v_tasa_igv / 100), 2), total = ROUND(v_subtotal * (1 + (v_tasa_igv / 100)), 2)
                WHERE id_cotizacion = p_id_cotizacion;
            END$$

CREATE DEFINER=`u348616500_sigesto`@`127.0.0.1` PROCEDURE `sp_verificar_conflicto_coordinacion` (IN `p_id_tecnico` BIGINT UNSIGNED, IN `p_fecha_coordinada` DATE, IN `p_hora_coordinada` TIME, IN `p_uuid_solicitud_excluir` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)   BEGIN
                DECLARE v_conflicto_existe INT DEFAULT 0;
                DECLARE v_uuid_conflicto CHAR(36);
                DECLARE v_hora_conflicto TIME;
                DECLARE v_direccion_conflicto VARCHAR(255);

                SET @hora_inicio = DATE_SUB(p_hora_coordinada, INTERVAL 1 HOUR);
                SET @hora_fin = DATE_ADD(p_hora_coordinada, INTERVAL 1 HOUR);

                SELECT COUNT(*), MAX(uuid_solicitud), MAX(hora_coordinada), MAX(direccion_servicio)
                INTO v_conflicto_existe, v_uuid_conflicto, v_hora_conflicto, v_direccion_conflicto
                FROM solicitudes
                WHERE id_tecnico = p_id_tecnico
                    AND fecha_coordinada = p_fecha_coordinada
                    AND hora_coordinada IS NOT NULL
                    AND hora_coordinada BETWEEN @hora_inicio AND @hora_fin
                    AND (p_uuid_solicitud_excluir IS NULL OR uuid_solicitud COLLATE utf8mb4_unicode_ci != p_uuid_solicitud_excluir COLLATE utf8mb4_unicode_ci)
                    AND estado IN ('ASIGNADA', 'EN_PROCESO', 'COTIZADA', 'REVISION_PAGO', 'APROBADA')
                    AND deleted_at IS NULL;

                IF v_conflicto_existe > 0 THEN
                    SELECT 1 AS tiene_conflicto, v_uuid_conflicto AS uuid_solicitud_conflicto,
                        v_hora_conflicto AS hora_coordinada_conflicto, v_direccion_conflicto AS direccion_conflicto,
                        CONCAT('El técnico ya tiene una visita coordinada a las ', TIME_FORMAT(v_hora_conflicto, '%H:%i'), ' del mismo día en ', v_direccion_conflicto) AS mensaje_conflicto;
                ELSE
                    SELECT 0 AS tiene_conflicto, NULL AS uuid_solicitud_conflicto, NULL AS hora_coordinada_conflicto,
                        NULL AS direccion_conflicto, 'No hay conflictos de coordinación' AS mensaje_conflicto;
                END IF;
            END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cotizaciones`
--

CREATE TABLE `cotizaciones` (
  `id_cotizacion` bigint(20) UNSIGNED NOT NULL,
  `uuid_solicitud` char(36) NOT NULL,
  `estado` enum('BORRADOR','ENVIADA','APROBADA','RECHAZADA','LIQUIDADA') NOT NULL DEFAULT 'BORRADOR',
  `tasa_igv` decimal(5,2) NOT NULL DEFAULT 18.00,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `igv` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `id_usuario_creador` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cotizaciones`
--

INSERT INTO `cotizaciones` (`id_cotizacion`, `uuid_solicitud`, `estado`, `tasa_igv`, `subtotal`, `igv`, `total`, `id_usuario_creador`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '019f498f-f0ac-7277-b097-81de9dc6f605', 'ENVIADA', 18.00, 692.00, 124.56, 816.56, 5, '2026-07-10 01:06:37', '2026-07-12 19:34:52', NULL),
(2, '019f49fb-eb47-729c-97d1-699c10bed288', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-10 03:04:34', '2026-07-10 03:04:34', NULL),
(3, '019f4cb2-314e-706c-8258-98fd10b0fc94', 'ENVIADA', 18.00, 115.00, 20.70, 135.70, 3, '2026-07-10 15:42:54', '2026-07-13 17:11:47', NULL),
(4, '019f4d1a-4441-71ec-8c8e-995bca10ecfd', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 3, '2026-07-10 17:36:34', '2026-07-10 17:36:34', NULL),
(5, '019f4d2d-c620-70f5-865c-bd187dda5bb1', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 3, '2026-07-10 17:57:53', '2026-07-10 17:57:53', NULL),
(6, '019f5346-8e52-72e7-bf06-4fe0fed359e7', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-11 22:22:40', '2026-07-11 22:22:40', NULL),
(7, '019f5368-0a39-7029-99d5-c4a65ac2db13', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-11 22:59:15', '2026-07-11 22:59:15', NULL),
(8, '019f5369-99c1-727b-9053-e7723cd923a0', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-11 23:00:57', '2026-07-11 23:00:57', NULL),
(9, '019f536a-1a2e-728d-bcf5-edbf7a46552a', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-11 23:01:30', '2026-07-11 23:01:30', NULL),
(10, '019f536a-a428-7189-b2df-a5c7b48b6ef1', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-11 23:02:05', '2026-07-11 23:02:05', NULL),
(11, '019f53a7-4689-7253-a83d-d077a48491cb', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 5, '2026-07-12 00:08:19', '2026-07-12 00:08:19', NULL),
(12, '019f5c64-0aa3-73aa-8515-64d59219e511', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 3, '2026-07-13 16:51:28', '2026-07-13 16:51:28', NULL),
(13, '019f5c70-ac72-731b-98fb-3b49673d85c0', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 3, '2026-07-13 17:05:15', '2026-07-13 17:05:15', NULL),
(14, '019f5c77-edd8-720d-88df-824529f7349a', 'BORRADOR', 18.00, 0.00, 0.00, 0.00, 3, '2026-07-13 17:13:11', '2026-07-13 17:13:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `detalle_cotizacion`
--

CREATE TABLE `detalle_cotizacion` (
  `id_detalle` bigint(20) UNSIGNED NOT NULL,
  `id_cotizacion` bigint(20) UNSIGNED NOT NULL,
  `id_item` bigint(20) UNSIGNED NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_aplicado` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) GENERATED ALWAYS AS (`cantidad` * `precio_aplicado`) STORED
) ;

--
-- Dumping data for table `detalle_cotizacion`
--

INSERT INTO `detalle_cotizacion` (`id_detalle`, `id_cotizacion`, `id_item`, `cantidad`, `precio_aplicado`) VALUES
(1, 1, 6, 1.00, 35.00),
(2, 1, 7, 1.00, 42.00),
(3, 1, 18, 1.00, 80.00),
(4, 1, 21, 1.00, 35.00),
(5, 1, 16, 1.00, 500.00),
(6, 3, 6, 1.00, 35.00),
(7, 3, 18, 1.00, 80.00);

--
-- Triggers `detalle_cotizacion`
--
DELIMITER $$
CREATE TRIGGER `trg_detalle_cotizacion_ad` AFTER DELETE ON `detalle_cotizacion` FOR EACH ROW BEGIN CALL sp_recalcular_totales_cotizacion(OLD.id_cotizacion); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_detalle_cotizacion_ai` AFTER INSERT ON `detalle_cotizacion` FOR EACH ROW BEGIN CALL sp_recalcular_totales_cotizacion(NEW.id_cotizacion); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_detalle_cotizacion_au` AFTER UPDATE ON `detalle_cotizacion` FOR EACH ROW BEGIN CALL sp_recalcular_totales_cotizacion(NEW.id_cotizacion); END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `evidencias`
--

CREATE TABLE `evidencias` (
  `id_evidencia` bigint(20) UNSIGNED NOT NULL,
  `uuid_solicitud` char(36) NOT NULL,
  `tipo_evidencia` enum('FOTO_ANTES','FOTO_DESPUES','FIRMA_CLIENTE','OTRO') NOT NULL,
  `url_archivo` varchar(500) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `historial_estados`
--

CREATE TABLE `historial_estados` (
  `id_historial` bigint(20) UNSIGNED NOT NULL,
  `uuid_solicitud` char(36) NOT NULL,
  `estado_anterior` varchar(50) DEFAULT NULL,
  `estado_nuevo` varchar(50) NOT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_usuario_accion` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `historial_estados`
--

INSERT INTO `historial_estados` (`id_historial`, `uuid_solicitud`, `estado_anterior`, `estado_nuevo`, `fecha_cambio`, `id_usuario_accion`) VALUES
(1, '019f498f-f0ac-7277-b097-81de9dc6f605', NULL, 'PENDIENTE', '2026-07-10 01:06:37', 5),
(2, '019f498f-f0ac-7277-b097-81de9dc6f605', 'PENDIENTE', 'ASIGNADA', '2026-07-10 01:09:43', 1),
(3, '019f49fb-eb47-729c-97d1-699c10bed288', NULL, 'PENDIENTE', '2026-07-10 03:04:34', 5),
(4, '019f49fb-eb47-729c-97d1-699c10bed288', 'PENDIENTE', 'ASIGNADA', '2026-07-10 03:06:15', 1),
(5, '019f4cb2-314e-706c-8258-98fd10b0fc94', NULL, 'PENDIENTE', '2026-07-10 15:42:54', 3),
(6, '019f4d1a-4441-71ec-8c8e-995bca10ecfd', NULL, 'PENDIENTE', '2026-07-10 17:36:34', 3),
(7, '019f4d2d-c620-70f5-865c-bd187dda5bb1', NULL, 'PENDIENTE', '2026-07-10 17:57:53', 3),
(8, '019f5346-8e52-72e7-bf06-4fe0fed359e7', NULL, 'PENDIENTE', '2026-07-11 22:22:40', 5),
(9, '019f5368-0a39-7029-99d5-c4a65ac2db13', NULL, 'PENDIENTE', '2026-07-11 22:59:15', 5),
(10, '019f5369-99c1-727b-9053-e7723cd923a0', NULL, 'PENDIENTE', '2026-07-11 23:00:57', 5),
(11, '019f536a-1a2e-728d-bcf5-edbf7a46552a', NULL, 'PENDIENTE', '2026-07-11 23:01:30', 5),
(12, '019f536a-a428-7189-b2df-a5c7b48b6ef1', NULL, 'PENDIENTE', '2026-07-11 23:02:05', 5),
(13, '019f53a7-4689-7253-a83d-d077a48491cb', NULL, 'PENDIENTE', '2026-07-12 00:08:19', 5),
(14, '019f498f-f0ac-7277-b097-81de9dc6f605', 'ASIGNADA', 'COTIZADA', '2026-07-12 19:34:52', 2),
(15, '019f4cb2-314e-706c-8258-98fd10b0fc94', 'PENDIENTE', 'ASIGNADA', '2026-07-13 15:49:33', 1),
(16, '019f4d1a-4441-71ec-8c8e-995bca10ecfd', 'PENDIENTE', 'ASIGNADA', '2026-07-13 16:16:27', 1),
(17, '019f4d2d-c620-70f5-865c-bd187dda5bb1', 'PENDIENTE', 'ASIGNADA', '2026-07-13 16:18:04', 1),
(18, '019f5346-8e52-72e7-bf06-4fe0fed359e7', 'PENDIENTE', 'ASIGNADA', '2026-07-13 16:30:13', 1),
(19, '019f5c64-0aa3-73aa-8515-64d59219e511', NULL, 'PENDIENTE', '2026-07-13 16:51:28', 3),
(20, '019f5c70-ac72-731b-98fb-3b49673d85c0', NULL, 'PENDIENTE', '2026-07-13 17:05:15', 3),
(21, '019f4cb2-314e-706c-8258-98fd10b0fc94', 'ASIGNADA', 'COTIZADA', '2026-07-13 17:11:47', 2),
(22, '019f5c77-edd8-720d-88df-824529f7349a', NULL, 'PENDIENTE', '2026-07-13 17:13:11', 3);

-- --------------------------------------------------------

--
-- Table structure for table `items_catalogo`
--

CREATE TABLE `items_catalogo` (
  `id_item` bigint(20) UNSIGNED NOT NULL,
  `sku_codigo` varchar(50) DEFAULT NULL,
  `tipo_item` enum('MATERIAL','SERVICIO') NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `unidad_medida` varchar(20) DEFAULT NULL,
  `precio_ref` decimal(10,2) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `items_catalogo`
--

INSERT INTO `items_catalogo` (`id_item`, `sku_codigo`, `tipo_item`, `nombre`, `descripcion`, `unidad_medida`, `precio_ref`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'MAT01', 'MATERIAL', 'Cable u', 'Cable u para solucionar cosas', 'metro', 6.00, 1, '2026-07-10 01:02:37', '2026-07-10 01:02:37'),
(2, 'CABLE-THW-2.5', 'MATERIAL', 'Cable THW 2.5mm', 'Conductor eléctrico de cobre, aislamiento termoplástico, calibre 14 AWG, rollo de 100 metros', 'ROLLO', 135.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(3, 'CABLE-THW-4.0', 'MATERIAL', 'Cable THW 4.0mm', 'Conductor eléctrico de cobre, aislamiento termoplástico, calibre 12 AWG, rollo de 100 metros', 'ROLLO', 215.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(4, 'TABLERO-8P', 'MATERIAL', 'Tablero de Distribución 8 Polos', 'Tablero empotrable/sobrepuesto con barra de tierra, puerta transparente', 'UNIDAD', 280.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(5, 'TABLERO-12P', 'MATERIAL', 'Tablero de Distribución 12 Polos', 'Tablero empotrable/sobrepuesto con barra de tierra, puerta transparente', 'UNIDAD', 350.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(6, 'BREAKER-20A', 'MATERIAL', 'Breaker Termomagnético 20A', 'Interruptor termomagnético bipolar, protección contra sobrecargas y cortocircuitos', 'UNIDAD', 35.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(7, 'BREAKER-30A', 'MATERIAL', 'Breaker Termomagnético 30A', 'Interruptor termomagnético bipolar, protección contra sobrecargas y cortocircuitos', 'UNIDAD', 42.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(8, 'TOMA-DOBLE', 'MATERIAL', 'Tomacorriente Doble Polarizado', 'Tomacorriente doble con placa decorativa blanca, 10A', 'UNIDAD', 8.50, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(9, 'INTERRUPTOR-SIMPLE', 'MATERIAL', 'Interruptor Simple', 'Interruptor de 1 vía con placa decorativa blanca', 'UNIDAD', 6.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(10, 'FOCO-LED-9W', 'MATERIAL', 'Foco LED 9W Luz Blanca', 'Foco LED de bajo consumo, luz blanca 6500K, vida útil 25,000 horas', 'UNIDAD', 12.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(11, 'FOCO-LED-15W', 'MATERIAL', 'Foco LED 15W Luz Blanca', 'Foco LED de alto brillo, luz blanca 6500K, vida útil 25,000 horas', 'UNIDAD', 18.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(12, 'TUBERIA-CONDUIT-3/4', 'MATERIAL', 'Tubería Conduit 3/4\"', 'Tubería PVC conduit rígida, tramo de 3 metros', 'TRAMO', 12.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(13, 'CAJA-DERIVACION', 'MATERIAL', 'Caja de Derivación Rectangular', 'Caja de paso PVC 4x4 pulgadas con tapa', 'UNIDAD', 6.50, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(14, 'CINTA-AISLANTE', 'MATERIAL', 'Cinta Aislante 3M', 'Cinta aislante eléctrica negra, rollo de 18 metros', 'ROLLO', 4.50, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(15, 'CANALETA-20MM', 'MATERIAL', 'Canaleta Plástica 20mm', 'Canaleta PVC autoadhesiva, tramo de 2 metros', 'TRAMO', 8.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(16, 'MO-INSTALACION', 'SERVICIO', 'Mano de Obra: Instalación', 'Servicio de instalación eléctrica completa de tablero y cableado básico', 'SERVICIO', 500.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(17, 'MO-MANTENIMIENTO', 'SERVICIO', 'Mantenimiento Preventivo', 'Servicio de revisión, limpieza y ajuste de conexiones eléctricas', 'SERVICIO', 120.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(18, 'MO-DIAGNOSTICO', 'SERVICIO', 'Diagnóstico Eléctrico', 'Evaluación completa del sistema eléctrico con informe técnico', 'SERVICIO', 80.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(19, 'MO-REPARACION', 'SERVICIO', 'Reparación de Cortocircuito', 'Servicio de diagnóstico y reparación de fallas eléctricas', 'SERVICIO', 250.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(20, 'MO-RECABLEADO', 'SERVICIO', 'Recableado Completo', 'Servicio de reemplazo total de cableado en ambiente o vivienda', 'SERVICIO', 800.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47'),
(21, 'MO-INSTALACION-PUNTO', 'SERVICIO', 'Instalación de Punto Eléctrico', 'Servicio de instalación de tomacorriente o interruptor individual', 'SERVICIO', 35.00, 1, '2026-07-10 01:34:47', '2026-07-10 01:34:47');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_06_08_133801_create_personal_access_tokens_table', 1),
(2, '2026_06_08_140400_create_roles_table', 1),
(3, '2026_06_08_141022_create_usuarios_table', 1),
(4, '2026_06_08_141031_create_perfiles_admin_table', 1),
(5, '2026_06_08_141036_create_perfiles_tecnicos_table', 1),
(6, '2026_06_08_141042_create_perfiles_clientes_table', 1),
(7, '2026_06_08_141047_create_items_catalogo_table', 1),
(8, '2026_06_08_141052_create_solicitudes_table', 1),
(9, '2026_06_08_141057_create_historial_estados_table', 1),
(10, '2026_06_08_141102_create_cotizaciones_table', 1),
(11, '2026_06_08_141111_create_detalle_cotizacion_table', 1),
(12, '2026_06_08_141116_create_evidencias_table', 1),
(13, '2026_06_08_141121_create_pagos_table', 1),
(14, '2026_06_08_141126_create_vistas_y_procedimientos', 1),
(15, '2026_06_12_052657_create_procedures_and_triggers', 1),
(16, '2026_07_08_041023_create_tipos_trabajo_table', 1),
(17, '2026_07_08_041426_create_tipo_trabajo_items_sugeridos_table', 1),
(18, '2026_07_10_032857_add_ubicacion_to_solicitudes_table', 2);

-- --------------------------------------------------------

--
-- Table structure for table `pagos`
--

CREATE TABLE `pagos` (
  `id_pago` bigint(20) UNSIGNED NOT NULL,
  `uuid_solicitud` char(36) NOT NULL,
  `id_usuario_registro` bigint(20) UNSIGNED NOT NULL,
  `monto_pagado` decimal(12,2) NOT NULL,
  `metodo_pago` enum('EFECTIVO','YAPE','PLIN','TRANSFERENCIA','TARJETA') NOT NULL,
  `nro_operacion` varchar(100) DEFAULT NULL,
  `estado_pago` enum('PENDIENTE_APROBACION','COMPLETADO','RECHAZADO','REEMBOLSADO') NOT NULL DEFAULT 'PENDIENTE_APROBACION',
  `url_comprobante` varchar(500) DEFAULT NULL,
  `tipo_pago` enum('ADELANTO','FINAL') NOT NULL DEFAULT 'FINAL',
  `id_usuario_aprobacion` bigint(20) UNSIGNED DEFAULT NULL,
  `fecha_aprobacion` timestamp NULL DEFAULT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `perfiles_admin`
--

CREATE TABLE `perfiles_admin` (
  `id_admin` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `perfiles_admin`
--

INSERT INTO `perfiles_admin` (`id_admin`, `id_usuario`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `perfiles_clientes`
--

CREATE TABLE `perfiles_clientes` (
  `id_cliente` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `dni_ruc` varchar(20) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `perfiles_clientes`
--

INSERT INTO `perfiles_clientes` (`id_cliente`, `id_usuario`, `dni_ruc`, `telefono`, `direccion`, `deleted_at`) VALUES
(1, 3, '10123456789', '987654321', 'Av. Sol 123, Cusco', NULL),
(2, 5, '75315978', '935 358 929', 'av los inkas s/n', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `perfiles_tecnicos`
--

CREATE TABLE `perfiles_tecnicos` (
  `id_tecnico` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `dni` char(8) NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `perfiles_tecnicos`
--

INSERT INTO `perfiles_tecnicos` (`id_tecnico`, `id_usuario`, `dni`, `especialidad`, `disponible`, `deleted_at`) VALUES
(1, 2, '12345678', 'Electricidad Residencial', 1, NULL),
(2, 4, '75315985', 'Electricista', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\Usuario', 1, 'sigesto-app', 'eab6edc5840a0791dd76cff83f22969163beeb0ead93d5577bd3e4ffc5768ebf', '[\"*\"]', '2026-07-09 18:01:12', NULL, '2026-07-09 18:00:00', '2026-07-09 18:01:12'),
(2, 'App\\Models\\Usuario', 2, 'sigesto-app', '241ac0b675c77e87049bd1867c1d07f97d14711d809342add5546ad4a8f1e3b6', '[\"*\"]', '2026-07-09 18:01:06', NULL, '2026-07-09 18:00:59', '2026-07-09 18:01:06'),
(3, 'App\\Models\\Usuario', 3, 'sigesto-app', '9fcc2e4dcb94138672c4c3a501e8bee9ad6f2af5c777ae173db4c487732e265f', '[\"*\"]', '2026-07-09 18:05:44', NULL, '2026-07-09 18:01:12', '2026-07-09 18:05:44'),
(4, 'App\\Models\\Usuario', 3, 'sigesto-app', '81fcb50ff7ff13d528574023403e95559ee02586e37b6892e41907ad8f50e426', '[\"*\"]', '2026-07-09 18:02:21', NULL, '2026-07-09 18:02:20', '2026-07-09 18:02:21'),
(5, 'App\\Models\\Usuario', 1, 'sigesto-app', '68f633dba6182fb0faf1e1b5cdd9e505d23d744f65eda94aa9334edfc05fabcf', '[\"*\"]', '2026-07-10 00:32:46', NULL, '2026-07-10 00:32:26', '2026-07-10 00:32:46'),
(6, 'App\\Models\\Usuario', 1, 'sigesto-app', 'cab7601f52965c4d20ff2289b155db17353f18a8087452c0a5f94c2b94b4c82c', '[\"*\"]', '2026-07-10 00:33:40', NULL, '2026-07-10 00:33:34', '2026-07-10 00:33:40'),
(7, 'App\\Models\\Usuario', 1, 'sigesto-app', '44b6c7ca74ba513fa8bc7e75a89647f04d0ff3642153eb881b6d5e2246eb352e', '[\"*\"]', '2026-07-10 00:36:56', NULL, '2026-07-10 00:36:46', '2026-07-10 00:36:56'),
(8, 'App\\Models\\Usuario', 1, 'sigesto-app', '0b697c1536872f0c8e20b6efcf5782c558e07257883e7234c1d955d8c6c968ed', '[\"*\"]', '2026-07-10 03:03:32', NULL, '2026-07-10 00:56:57', '2026-07-10 03:03:32'),
(9, 'App\\Models\\Usuario', 5, 'sigesto-app', 'c8639f8c3da00f64ee5fa3f4460a35c9c638801e29d6a7aef40fd8d0cc638853', '[\"*\"]', '2026-07-12 00:08:20', NULL, '2026-07-10 01:05:19', '2026-07-12 00:08:20'),
(10, 'App\\Models\\Usuario', 1, 'sigesto-app', '54bfb228d1a85d4e3191ac547aadcfb979d872ccd72dd29463f75ee39f7d407e', '[\"*\"]', '2026-07-10 02:26:05', NULL, '2026-07-10 02:25:48', '2026-07-10 02:26:05'),
(11, 'App\\Models\\Usuario', 1, 'sigesto-app', '7650d792bfafa6463bd5ca2fa19255e1457ef75355bdd1929233e732b293b399', '[\"*\"]', '2026-07-10 04:48:58', NULL, '2026-07-10 03:05:53', '2026-07-10 04:48:58'),
(12, 'App\\Models\\Usuario', 2, 'sigesto-app', '928bd0447a44da0e422c6548d7ea87f2032039d3cbc1ce785de40d6e829f06d1', '[\"*\"]', NULL, NULL, '2026-07-10 04:24:38', '2026-07-10 04:24:38'),
(13, 'App\\Models\\Usuario', 3, 'sigesto-app', '463e42ca21334977b6702d413092a0cbb0e248fee8b51326fb1a293282a4fc9e', '[\"*\"]', '2026-07-10 04:24:44', NULL, '2026-07-10 04:24:44', '2026-07-10 04:24:44'),
(14, 'App\\Models\\Usuario', 1, 'sigesto-app', '17386b2b96aebd2f7bf00159c0719d611722652d2ac3e221554be8a179f229da', '[\"*\"]', '2026-07-10 04:59:00', NULL, '2026-07-10 04:49:39', '2026-07-10 04:59:00'),
(15, 'App\\Models\\Usuario', 1, 'sigesto-app', '02b5293c7a35be8765b69d2dfaa708c28661874def30d828d5c3431b7da44dbd', '[\"*\"]', '2026-07-10 05:06:13', NULL, '2026-07-10 05:01:27', '2026-07-10 05:06:13'),
(16, 'App\\Models\\Usuario', 1, 'sigesto-app', '25f856096847667e8e54abcad0d1ea5a69558b846dd277e217b67bdb7acee976', '[\"*\"]', '2026-07-10 05:06:50', NULL, '2026-07-10 05:06:35', '2026-07-10 05:06:50'),
(18, 'App\\Models\\Usuario', 3, 'sigesto-app', '93323e2f620d397035db7fef681f938c83821c10f3447d7de15f76bb684c8330', '[\"*\"]', '2026-07-10 18:04:16', NULL, '2026-07-10 15:56:34', '2026-07-10 18:04:16'),
(19, 'App\\Models\\Usuario', 3, 'sigesto-app', '32a6c22c6e2ec850c667be159c7cd93cfe3fcb003a5d8e3e75395603a1a83b73', '[\"*\"]', '2026-07-13 17:13:13', NULL, '2026-07-10 15:59:02', '2026-07-13 17:13:13'),
(20, 'App\\Models\\Usuario', 2, 'sigesto-app', 'bae47f66211b737874de8a9cae8be73ab0fd80bea7d123a1f0201f56996073a0', '[\"*\"]', '2026-07-11 17:46:27', NULL, '2026-07-11 17:46:25', '2026-07-11 17:46:27'),
(21, 'App\\Models\\Usuario', 3, 'sigesto-app', '99df67ba33e8792f0417de2d5651f365fd97b45540beea6caee65cb6ebbe7340', '[\"*\"]', '2026-07-11 20:03:39', NULL, '2026-07-11 19:56:42', '2026-07-11 20:03:39'),
(22, 'App\\Models\\Usuario', 1, 'sigesto-app', '402a064a78c83f763a4340723c454b35c059b9fd2137ce01e5939d44dc3d233f', '[\"*\"]', '2026-07-11 22:22:53', NULL, '2026-07-11 22:06:47', '2026-07-11 22:22:53'),
(23, 'App\\Models\\Usuario', 1, 'sigesto-app', '6d7bb45ef4ba09c9de9cbea04e89b237f04a4cef8fe2c4db9a06ba4ba0122544', '[\"*\"]', '2026-07-11 22:07:24', NULL, '2026-07-11 22:07:14', '2026-07-11 22:07:24'),
(24, 'App\\Models\\Usuario', 1, 'sigesto-app', '5b3d868b789a6b03065eacb75fbf0a47738e450345a8026304a9f2e083da2da8', '[\"*\"]', '2026-07-11 22:49:02', NULL, '2026-07-11 22:40:56', '2026-07-11 22:49:02'),
(25, 'App\\Models\\Usuario', 1, 'sigesto-app', '11ea90bc96229f19e324beeb4d4045a12333fc7a3ad39874b7e6e93cb690b1e8', '[\"*\"]', '2026-07-11 23:31:14', NULL, '2026-07-11 22:49:29', '2026-07-11 23:31:14'),
(26, 'App\\Models\\Usuario', 1, 'sigesto-app', 'ad240718545a1d0558576a29402d6411b8c02215758b36b147c1076d498c5515', '[\"*\"]', '2026-07-11 23:42:45', NULL, '2026-07-11 23:37:00', '2026-07-11 23:42:45'),
(27, 'App\\Models\\Usuario', 1, 'sigesto-app', '4a32bb3832e6128528f4882ad10aa5b192602f3e05c85000b6e0be6b5c9a858f', '[\"*\"]', '2026-07-11 23:49:13', NULL, '2026-07-11 23:43:08', '2026-07-11 23:49:13'),
(28, 'App\\Models\\Usuario', 1, 'sigesto-app', '8924090047fd8d68134d968cc14c906c04eeca1eb075be9945bebe0a473d296a', '[\"*\"]', '2026-07-11 23:53:38', NULL, '2026-07-11 23:49:38', '2026-07-11 23:53:38'),
(29, 'App\\Models\\Usuario', 1, 'sigesto-app', '218f3b1a10c1dea4fe0b4901365fffbc82d9663ff439296f7f44d65045384f74', '[\"*\"]', '2026-07-12 00:02:00', NULL, '2026-07-11 23:53:54', '2026-07-12 00:02:00'),
(30, 'App\\Models\\Usuario', 1, 'sigesto-app', '2c11b9e83284990cdae80f76955c0b06d3ec59e0594eb8ead068cc91c2ac5657', '[\"*\"]', '2026-07-12 00:00:24', NULL, '2026-07-11 23:57:38', '2026-07-12 00:00:24'),
(31, 'App\\Models\\Usuario', 1, 'sigesto-app', '96af5302a76f422b3a57515ada1b6d792d1f8c5eb7723c89f67e954d579c5b04', '[\"*\"]', '2026-07-12 00:00:10', NULL, '2026-07-12 00:00:05', '2026-07-12 00:00:10'),
(32, 'App\\Models\\Usuario', 1, 'sigesto-app', '35b6b2b9e92bf420cb0a539e5ac5be980cae97e5bd8307cd54a80ce00a78cad1', '[\"*\"]', '2026-07-12 00:06:10', NULL, '2026-07-12 00:02:20', '2026-07-12 00:06:10'),
(33, 'App\\Models\\Usuario', 1, 'sigesto-app', 'd84ef2c577e257f495fa651c3ea487b0cd966e6e901666ca2d4f3e312704ebcf', '[\"*\"]', '2026-07-12 00:28:28', NULL, '2026-07-12 00:06:38', '2026-07-12 00:28:28'),
(34, 'App\\Models\\Usuario', 1, 'sigesto-app', 'ce06015ff9bc816f1d3d6fdfb390a4eb801ab429856e23f6ba2c905bafb62fd6', '[\"*\"]', '2026-07-12 00:28:29', NULL, '2026-07-12 00:25:23', '2026-07-12 00:28:29'),
(35, 'App\\Models\\Usuario', 1, 'sigesto-app', '63572b97b9936d62ccfe0252a73b723fe72fcf3a6fcbf4701a4de810d87e14d7', '[\"*\"]', '2026-07-12 00:34:01', NULL, '2026-07-12 00:33:55', '2026-07-12 00:34:01'),
(36, 'App\\Models\\Usuario', 1, 'sigesto-app', 'cc3087e6c4d7bef339696be84e565fefda6a51acf2b318bd2db2f3f9540ae707', '[\"*\"]', '2026-07-12 01:02:28', NULL, '2026-07-12 00:34:18', '2026-07-12 01:02:28'),
(37, 'App\\Models\\Usuario', 1, 'sigesto-app', 'ea06d49e90021063d75218c3c8618e6996f28b9ec49c4f7fdbe729d9b3bc13c5', '[\"*\"]', '2026-07-12 01:23:19', NULL, '2026-07-12 01:02:38', '2026-07-12 01:23:19'),
(38, 'App\\Models\\Usuario', 2, 'sigesto-app', '38003b3f18d0e6335ff75aa34072365b2d3d26c85c09aa19a81e8fec1202c523', '[\"*\"]', '2026-07-12 19:35:22', NULL, '2026-07-12 19:33:50', '2026-07-12 19:35:22'),
(39, 'App\\Models\\Usuario', 2, 'sigesto-app', 'b21b6f91abc3deb2785b9da21d4a258a5d4a79e58cbbb7de1e573d340abb7f4b', '[\"*\"]', '2026-07-12 22:57:27', NULL, '2026-07-12 22:54:52', '2026-07-12 22:57:27'),
(40, 'App\\Models\\Usuario', 2, 'sigesto-app', '2b1308a9470d8140a8c78d9c7071757344d120531773274c253c3d82c6e6a001', '[\"*\"]', '2026-07-12 23:00:10', NULL, '2026-07-12 22:59:10', '2026-07-12 23:00:10'),
(41, 'App\\Models\\Usuario', 2, 'sigesto-app', '3d151275601df9cdd7e1184cf46194c5f96b2fdb7e6e1027fd2b885ffa623ad2', '[\"*\"]', '2026-07-12 23:02:35', NULL, '2026-07-12 23:02:21', '2026-07-12 23:02:35'),
(42, 'App\\Models\\Usuario', 2, 'sigesto-app', 'ed1e2b95377d58d912bc61c5025394f5a4a1b012b10e8e0c89fca1f753fe2e7e', '[\"*\"]', '2026-07-12 23:06:43', NULL, '2026-07-12 23:05:08', '2026-07-12 23:06:43'),
(43, 'App\\Models\\Usuario', 2, 'sigesto-app', 'a5abac371e7f067cbdb44574f45192f88db755f142254d1c04c9de9d4b79f4bc', '[\"*\"]', '2026-07-12 23:12:24', NULL, '2026-07-12 23:11:13', '2026-07-12 23:12:24'),
(44, 'App\\Models\\Usuario', 2, 'sigesto-app', '61d3401e9fd96036b1f112fd063cc4ce4a59d0f80a43e47b6d1c7c69a2353adb', '[\"*\"]', '2026-07-13 00:28:09', NULL, '2026-07-13 00:27:44', '2026-07-13 00:28:09'),
(45, 'App\\Models\\Usuario', 2, 'sigesto-app', '8be869afd02ef08bc53b0167f78001bcac7e63bbb1b96b403145c0452065a0fa', '[\"*\"]', '2026-07-13 00:54:00', NULL, '2026-07-13 00:53:03', '2026-07-13 00:54:00'),
(46, 'App\\Models\\Usuario', 1, 'sigesto-app', '1dfab0190d463047a94cc36ab76263ca139a4be8a6a2324c684c2c0d75b1ab52', '[\"*\"]', '2026-07-13 03:43:45', NULL, '2026-07-13 01:19:09', '2026-07-13 03:43:45'),
(47, 'App\\Models\\Usuario', 1, 'sigesto-app', 'b627c584efc2d3a828e79c981d3776ab593470bbd4feaf8fd50959ac85538863', '[\"*\"]', '2026-07-13 04:03:59', NULL, '2026-07-13 04:02:29', '2026-07-13 04:03:59'),
(48, 'App\\Models\\Usuario', 1, 'sigesto-app', '8aa41018a37755cfffce5f1afb70df7be17d531728e96065a788acbebf87a52e', '[\"*\"]', '2026-07-13 13:36:11', NULL, '2026-07-13 13:35:50', '2026-07-13 13:36:11'),
(49, 'App\\Models\\Usuario', 1, 'sigesto-app', '7df4b3dcb9e600ea5323d3865d40447053958b857527997d0b3da7cf9ae4b3f0', '[\"*\"]', '2026-07-13 17:12:41', NULL, '2026-07-13 14:41:16', '2026-07-13 17:12:41'),
(50, 'App\\Models\\Usuario', 1, 'sigesto-app', '838642be4fd2e5e2bf12eae8e799d7eaddfea681f7fe26fdfaef017b6e32e8d7', '[\"*\"]', '2026-07-13 16:36:03', NULL, '2026-07-13 14:55:57', '2026-07-13 16:36:03'),
(51, 'App\\Models\\Usuario', 2, 'sigesto-app', 'ffc7d739f5422be1daf74a7738cd59498e24204a675f1c4cd2e921cdf117c914', '[\"*\"]', '2026-07-13 16:30:04', NULL, '2026-07-13 16:27:40', '2026-07-13 16:30:04'),
(52, 'App\\Models\\Usuario', 1, 'sigesto-app', 'bfe513896b6a3708e109f521a2d6aa961368b41204a452d52e71e11487efaf6e', '[\"*\"]', '2026-07-13 16:29:26', NULL, '2026-07-13 16:29:10', '2026-07-13 16:29:26'),
(53, 'App\\Models\\Usuario', 2, 'sigesto-app', 'ffdd93c860dcae3b8718eeab38538fa02258cf2f611dcccf7151110c1c3d1b24', '[\"*\"]', '2026-07-13 16:38:24', NULL, '2026-07-13 16:29:13', '2026-07-13 16:38:24'),
(54, 'App\\Models\\Usuario', 1, 'sigesto-app', '00c9165f60c599a90377a3eca6e04ff0f01984599b5d03c9848ca0bb8d0dcd14', '[\"*\"]', '2026-07-13 16:30:13', NULL, '2026-07-13 16:30:02', '2026-07-13 16:30:13'),
(55, 'App\\Models\\Usuario', 1, 'sigesto-app', 'babf0252e4532447a004feb0eb54dbd117857355a303ab4de8b183ac17689b8d', '[\"*\"]', '2026-07-13 16:55:18', NULL, '2026-07-13 16:32:02', '2026-07-13 16:55:18'),
(56, 'App\\Models\\Usuario', 1, 'sigesto-app', '2c914185cebe14464ae5a7f270077ae033ba6bd0f3ed18e9025c1aafa8e66d0e', '[\"*\"]', '2026-07-13 17:16:44', NULL, '2026-07-13 17:02:29', '2026-07-13 17:16:44'),
(57, 'App\\Models\\Usuario', 2, 'sigesto-app', 'd66ceef66d55ee7230d309d63b5e7fc6750f1865553688025fda0a8198ac01fa', '[\"*\"]', '2026-07-13 17:05:47', NULL, '2026-07-13 17:05:13', '2026-07-13 17:05:47'),
(58, 'App\\Models\\Usuario', 2, 'sigesto-app', 'd698d1fdb7bf1e06c2eddfae81e0cb2e359b326de134ce6ac5c03631bd3ab0f1', '[\"*\"]', '2026-07-13 17:07:21', NULL, '2026-07-13 17:07:16', '2026-07-13 17:07:21'),
(59, 'App\\Models\\Usuario', 2, 'sigesto-app', '0fa070eee1f45d6628d4af141f3a935f26b5c379396d81335e57e62a9668d1db', '[\"*\"]', '2026-07-13 17:12:15', NULL, '2026-07-13 17:10:12', '2026-07-13 17:12:15'),
(60, 'App\\Models\\Usuario', 2, 'sigesto-app', 'e30bdc6dacbe3d540691e9e79029c145fdfd5fc0ce4bcf060856a4bea026d384', '[\"*\"]', '2026-07-13 17:15:02', NULL, '2026-07-13 17:14:53', '2026-07-13 17:15:02');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id_rol` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`) VALUES
(1, 'ADMINISTRADOR'),
(3, 'CLIENTE'),
(2, 'TECNICO');

-- --------------------------------------------------------

--
-- Table structure for table `solicitudes`
--

CREATE TABLE `solicitudes` (
  `uuid_solicitud` char(36) NOT NULL,
  `id_cliente` bigint(20) UNSIGNED NOT NULL,
  `id_tecnico` bigint(20) UNSIGNED DEFAULT NULL,
  `estado` enum('PENDIENTE','ASIGNADA','COTIZADA','REVISION_PAGO','APROBADA','RECHAZADA','EN_PROCESO','FINALIZADA','PAGADA','CANCELADA') NOT NULL,
  `descripcion_problema` text NOT NULL,
  `direccion_servicio` varchar(255) NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `fecha_preferida` date DEFAULT NULL,
  `hora_preferida` time DEFAULT NULL,
  `notas_disponibilidad` varchar(500) DEFAULT NULL,
  `es_urgente` tinyint(1) NOT NULL DEFAULT 0,
  `materiales_cliente` text DEFAULT NULL,
  `fecha_coordinada` date DEFAULT NULL,
  `hora_coordinada` time DEFAULT NULL,
  `notas_coordinacion` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `solicitudes`
--

INSERT INTO `solicitudes` (`uuid_solicitud`, `id_cliente`, `id_tecnico`, `estado`, `descripcion_problema`, `direccion_servicio`, `latitud`, `longitud`, `fecha_preferida`, `hora_preferida`, `notas_disponibilidad`, `es_urgente`, `materiales_cliente`, `fecha_coordinada`, `hora_coordinada`, `notas_coordinacion`, `created_at`, `updated_at`, `deleted_at`) VALUES
('019f498f-f0ac-7277-b097-81de9dc6f605', 2, 1, 'COTIZADA', 'Se rompio el cableado de mi cassa', 'av los inkas s/n', NULL, NULL, '2026-07-10', '12:00:00', 'Quisiera agendar una fecha para que puedan venir a arreglarlo, Llamar antes de venir', 0, 'No tengo ninguno por el momento', '2026-07-10', '12:00:00', 'Registro desde terminal técnico.', '2026-07-10 01:06:37', '2026-07-12 19:34:52', NULL),
('019f49fb-eb47-729c-97d1-699c10bed288', 2, 2, 'ASIGNADA', 'qusiera presnetar algoque tengas', 'av los inkas s/n', NULL, NULL, '2026-07-10', '14:00:00', 'hola, Llamar antes de venir', 0, 'hola', '2026-07-10', '14:00:00', NULL, '2026-07-10 03:04:34', '2026-07-10 03:06:15', NULL),
('019f4cb2-314e-706c-8258-98fd10b0fc94', 1, 1, 'COTIZADA', 'aaaaaaaaaaaaaaaa', 'Av. Sol 123, Cusco', NULL, NULL, NULL, '10:00:00', 'Dejar en recepción', 1, 'aaaaaaaaaaaaaaaaaaaaaa', NULL, NULL, 'Registro desde terminal técnico.', '2026-07-10 15:42:54', '2026-07-13 17:11:47', NULL),
('019f4d1a-4441-71ec-8c8e-995bca10ecfd', 1, 1, 'ASIGNADA', 'Prueba unoooooooooooo', 'av la cultura', NULL, NULL, '2026-07-11', '16:00:00', 'Solo por las mañanas', 0, 'tablero', NULL, NULL, NULL, '2026-07-10 17:36:34', '2026-07-13 16:16:27', NULL),
('019f4d2d-c620-70f5-865c-bd187dda5bb1', 1, 1, 'ASIGNADA', 'prueba dossssssssssssss', 'Av. Sol 123, Cusco', NULL, NULL, '2026-07-18', '10:00:00', 'Llamar antes de venir', 0, 'cable', NULL, NULL, NULL, '2026-07-10 17:57:53', '2026-07-13 16:18:04', NULL),
('019f5346-8e52-72e7-bf06-4fe0fed359e7', 2, 1, 'ASIGNADA', 'asdasdsaddasdasdasdsad', 'av los inkas s/n', -12.12210000, -77.03050000, '2026-07-12', '10:00:00', 'adsasdasd', 0, 'asdasdasdasda', NULL, NULL, NULL, '2026-07-11 22:22:40', '2026-07-13 16:30:13', NULL),
('019f5368-0a39-7029-99d5-c4a65ac2db13', 2, NULL, 'PENDIENTE', 'cgygfygfvugurughghhjghkhjb', 'av los inkas s/n', -12.12210000, -77.03050000, NULL, '10:00:00', 'Llamar antes de venir, Solo por las mañanas, Llamar antes de venir', 1, 'asdasda', NULL, NULL, NULL, '2026-07-11 22:59:15', '2026-07-11 22:59:15', NULL),
('019f5369-99c1-727b-9053-e7723cd923a0', 2, NULL, 'PENDIENTE', 'HARRYHARRYHARRYHARRYHARRYHARRYHARRYHARRYHARRYHARRY', 'av los inkas s/n', -12.12210000, -77.03050000, '2026-07-11', '12:00:00', 'asdasdasdasdasd', 1, 'asdasdasdas', NULL, NULL, NULL, '2026-07-11 23:00:57', '2026-07-11 23:00:57', NULL),
('019f536a-1a2e-728d-bcf5-edbf7a46552a', 2, NULL, 'PENDIENTE', 'SINurgenciaSINurgenciaSINurgenciaSINurgenciaSINurgenciaSINurgenciaSINurgenciaSINurgenciaSINurgenciaSINurgencia', 'av los inkas s/n', -12.12210000, -77.03050000, NULL, '10:00:00', 'qweqweqweqwqwe', 1, 'qeweqweqweqweqwewqeqw', NULL, NULL, NULL, '2026-07-11 23:01:30', '2026-07-11 23:01:30', NULL),
('019f536a-a428-7189-b2df-a5c7b48b6ef1', 2, NULL, 'PENDIENTE', 'sin el urgenteplkease sin el urgenteplkease sin el urgenteplkease', 'av los inkas s/n', -12.12210000, -77.03050000, '2026-07-12', '14:00:00', 'asda2qqwdsadfadsads wqdwqd', 0, 'asdsasadsadsad dsadaqw', NULL, NULL, NULL, '2026-07-11 23:02:05', '2026-07-11 23:02:05', NULL),
('019f53a7-4689-7253-a83d-d077a48491cb', 2, NULL, 'PENDIENTE', 'una pruebuna prueba que estoy mandandoa que estoy mandando', 'av los inkas s/n', -12.12210000, -77.03050000, '2026-07-13', '12:00:00', 'una prueba que estoy mandandoaaa', 0, 'una prueba que estoy mandando', NULL, NULL, NULL, '2026-07-12 00:08:19', '2026-07-12 00:08:19', NULL),
('019f5c64-0aa3-73aa-8515-64d59219e511', 1, NULL, 'PENDIENTE', 'test unoooooooooooooo', 'Av. Sol 123, Cusco', NULL, NULL, '2026-07-25', '10:00:00', 'Solo por las mañanas', 0, 'cable', NULL, NULL, NULL, '2026-07-13 16:51:28', '2026-07-13 16:51:28', NULL),
('019f5c70-ac72-731b-98fb-3b49673d85c0', 1, NULL, 'PENDIENTE', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'Av. Sol 123, Cusco', NULL, NULL, '2026-07-25', '10:00:00', 'Dejar en recepción', 0, 'cable', NULL, NULL, NULL, '2026-07-13 17:05:15', '2026-07-13 17:05:15', NULL),
('019f5c77-edd8-720d-88df-824529f7349a', 1, NULL, 'PENDIENTE', 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 'Av. Sol 123, Cusco', NULL, NULL, '2026-07-25', '10:00:00', 'Preferente', 0, 'cable', NULL, NULL, NULL, '2026-07-13 17:13:11', '2026-07-13 17:13:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tipos_trabajo`
--

CREATE TABLE `tipos_trabajo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tipos_trabajo`
--

INSERT INTO `tipos_trabajo` (`id`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Instalación de Tablero Eléctrico', 'Instalación completa de tablero de distribución con breakers', 1, NULL, NULL),
(2, 'Instalación de Tomacorrientes', 'Instalación de puntos eléctricos y tomacorrientes', 1, NULL, NULL),
(3, 'Mantenimiento Preventivo', 'Revisión y mantenimiento preventivo de instalaciones eléctricas', 1, NULL, NULL),
(4, 'Reparación de Cortocircuito', 'Diagnóstico y reparación de fallas eléctricas', 1, NULL, NULL),
(5, 'Instalación de Iluminación LED', 'Instalación de focos y luminarias LED', 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tipo_trabajo_items_sugeridos`
--

CREATE TABLE `tipo_trabajo_items_sugeridos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_tipo_trabajo` bigint(20) UNSIGNED NOT NULL,
  `id_item` bigint(20) UNSIGNED NOT NULL,
  `cantidad_sugerida` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unidad_medida` varchar(20) DEFAULT NULL,
  `obligatorio` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tipo_trabajo_items_sugeridos`
--

INSERT INTO `tipo_trabajo_items_sugeridos` (`id`, `id_tipo_trabajo`, `id_item`, `cantidad_sugerida`, `unidad_medida`, `obligatorio`, `created_at`, `updated_at`) VALUES
(1, 1, 4, 1.00, NULL, 1, NULL, NULL),
(2, 1, 5, 1.00, NULL, 1, NULL, NULL),
(3, 1, 6, 2.00, NULL, 1, NULL, NULL),
(4, 1, 7, 2.00, NULL, 1, NULL, NULL),
(5, 1, 1, 10.00, NULL, 1, NULL, NULL),
(6, 1, 16, 1.00, NULL, 1, NULL, NULL),
(7, 2, 8, 1.00, NULL, 1, NULL, NULL),
(8, 2, 9, 1.00, NULL, 1, NULL, NULL),
(9, 2, 1, 5.00, NULL, 1, NULL, NULL),
(10, 2, 13, 2.00, NULL, 1, NULL, NULL),
(11, 2, 14, 1.00, NULL, 1, NULL, NULL),
(12, 2, 21, 1.00, NULL, 1, NULL, NULL),
(13, 3, 14, 2.00, NULL, 1, NULL, NULL),
(14, 3, 17, 1.00, NULL, 1, NULL, NULL),
(15, 4, 6, 1.00, NULL, 1, NULL, NULL),
(16, 4, 1, 10.00, NULL, 1, NULL, NULL),
(17, 4, 14, 1.00, NULL, 1, NULL, NULL),
(18, 4, 18, 1.00, NULL, 1, NULL, NULL),
(19, 4, 19, 1.00, NULL, 1, NULL, NULL),
(20, 5, 10, 4.00, NULL, 1, NULL, NULL),
(21, 5, 11, 4.00, NULL, 1, NULL, NULL),
(22, 5, 9, 2.00, NULL, 1, NULL, NULL),
(23, 5, 12, 5.00, NULL, 1, NULL, NULL),
(24, 5, 13, 2.00, NULL, 1, NULL, NULL),
(25, 5, 21, 1.00, NULL, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `id_rol` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `id_rol`, `email`, `password_hash`, `nombres`, `apellidos`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'admin@sigesto.com', '$2y$12$oEHUmYb8tX1LkBmpAdDAsuhX2NrtznlI02mdTnqrH0/LIpfu.Vsnq', 'Carlos', 'Administrador', '2026-07-09 17:59:46', '2026-07-09 17:59:46', NULL),
(2, 2, 'tecnico@sigesto.com', '$2y$12$JlE4xgwjNTmLzzM7fD4TDulAdWR1shfIYMBFVgfVbXagiDzEUDiAS', 'Juan', 'Electricista', '2026-07-09 17:59:46', '2026-07-09 17:59:46', NULL),
(3, 3, 'cliente@sigesto.com', '$2y$12$3Ar5HViwl915AvHnNg9oK.XL5OM8sciwfj9OUoYSZwDq48SlSQ1Te', 'Maria', 'Perez', '2026-07-09 17:59:47', '2026-07-09 17:59:47', NULL),
(4, 2, 'noe@sigesto.com', '$2y$12$N64USZEvW1wBcD4G3wbZYukn0BO6wu.wXidrUD6zwk4YmY8wWEcMO', 'Noe', 'Huayhua', '2026-07-10 00:58:26', '2026-07-10 00:58:26', NULL),
(5, 3, 'harry@sigesto.com', '$2y$12$mOZa0JdeHXSk2uRwZuZ0eO2i9XoVFWW/XU.2ZeG0DpNqoftHBOoEm', 'Harry', 'Agustin Gamarra', '2026-07-10 00:59:36', '2026-07-10 00:59:36', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_cotizaciones_resumen`
-- (See below for the actual view)
--
CREATE TABLE `vw_cotizaciones_resumen` (
`id_cotizacion` bigint(20) unsigned
,`uuid_solicitud` char(36)
,`estado` enum('BORRADOR','ENVIADA','APROBADA','RECHAZADA','LIQUIDADA')
,`subtotal` decimal(12,2)
,`igv` decimal(12,2)
,`total` decimal(12,2)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_pagos_resumen`
-- (See below for the actual view)
--
CREATE TABLE `vw_pagos_resumen` (
`id_pago` bigint(20) unsigned
,`uuid_solicitud` char(36)
,`monto_pagado` decimal(12,2)
,`metodo_pago` enum('EFECTIVO','YAPE','PLIN','TRANSFERENCIA','TARJETA')
,`estado_pago` enum('PENDIENTE_APROBACION','COMPLETADO','RECHAZADO','REEMBOLSADO')
,`fecha_pago` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_solicitudes_resumen`
-- (See below for the actual view)
--
CREATE TABLE `vw_solicitudes_resumen` (
`uuid_solicitud` char(36)
,`estado` enum('PENDIENTE','ASIGNADA','COTIZADA','REVISION_PAGO','APROBADA','RECHAZADA','EN_PROCESO','FINALIZADA','PAGADA','CANCELADA')
,`created_at` timestamp
,`id_cliente` bigint(20) unsigned
,`cliente_nombres` varchar(100)
,`cliente_apellidos` varchar(100)
,`id_tecnico` bigint(20) unsigned
,`tecnico_nombres` varchar(100)
,`tecnico_apellidos` varchar(100)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cotizaciones`
--
ALTER TABLE `cotizaciones`
  ADD PRIMARY KEY (`id_cotizacion`),
  ADD KEY `idx_estado_cotizacion` (`estado`),
  ADD KEY `idx_solicitud_cotizacion` (`uuid_solicitud`),
  ADD KEY `idx_creador` (`id_usuario_creador`);

--
-- Indexes for table `detalle_cotizacion`
--
ALTER TABLE `detalle_cotizacion`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `idx_detalle_cotizacion` (`id_cotizacion`),
  ADD KEY `idx_detalle_item` (`id_item`);

--
-- Indexes for table `evidencias`
--
ALTER TABLE `evidencias`
  ADD PRIMARY KEY (`id_evidencia`),
  ADD KEY `idx_evidencia_solicitud` (`uuid_solicitud`);

--
-- Indexes for table `historial_estados`
--
ALTER TABLE `historial_estados`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `historial_estados_id_usuario_accion_foreign` (`id_usuario_accion`),
  ADD KEY `idx_historial_solicitud` (`uuid_solicitud`),
  ADD KEY `idx_fecha_cambio` (`fecha_cambio`);

--
-- Indexes for table `items_catalogo`
--
ALTER TABLE `items_catalogo`
  ADD PRIMARY KEY (`id_item`),
  ADD UNIQUE KEY `items_catalogo_sku_codigo_unique` (`sku_codigo`),
  ADD KEY `idx_tipo_item` (`tipo_item`),
  ADD KEY `idx_nombre` (`nombre`),
  ADD KEY `idx_activo` (`activo`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `pagos_id_usuario_registro_foreign` (`id_usuario_registro`),
  ADD KEY `pagos_id_usuario_aprobacion_foreign` (`id_usuario_aprobacion`),
  ADD KEY `idx_pago_solicitud` (`uuid_solicitud`),
  ADD KEY `idx_estado_pago` (`estado_pago`),
  ADD KEY `idx_fecha_pago` (`fecha_pago`),
  ADD KEY `idx_tipo_pago` (`tipo_pago`);

--
-- Indexes for table `perfiles_admin`
--
ALTER TABLE `perfiles_admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `perfiles_admin_id_usuario_unique` (`id_usuario`);

--
-- Indexes for table `perfiles_clientes`
--
ALTER TABLE `perfiles_clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `perfiles_clientes_id_usuario_unique` (`id_usuario`),
  ADD UNIQUE KEY `perfiles_clientes_dni_ruc_unique` (`dni_ruc`);

--
-- Indexes for table `perfiles_tecnicos`
--
ALTER TABLE `perfiles_tecnicos`
  ADD PRIMARY KEY (`id_tecnico`),
  ADD UNIQUE KEY `perfiles_tecnicos_id_usuario_unique` (`id_usuario`),
  ADD UNIQUE KEY `perfiles_tecnicos_dni_unique` (`dni`),
  ADD KEY `idx_tecnico_disponible` (`disponible`),
  ADD KEY `idx_tecnico_especialidad` (`especialidad`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `roles_nombre_unique` (`nombre`);

--
-- Indexes for table `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD PRIMARY KEY (`uuid_solicitud`),
  ADD KEY `idx_estado_solicitud` (`estado`),
  ADD KEY `idx_tecnico` (`id_tecnico`),
  ADD KEY `idx_cliente` (`id_cliente`),
  ADD KEY `idx_fecha_creacion` (`created_at`),
  ADD KEY `idx_estado_tecnico` (`estado`,`id_tecnico`),
  ADD KEY `idx_ubicacion` (`latitud`,`longitud`);

--
-- Indexes for table `tipos_trabajo`
--
ALTER TABLE `tipos_trabajo`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tipo_trabajo_items_sugeridos`
--
ALTER TABLE `tipo_trabajo_items_sugeridos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tipo_trabajo_items_sugeridos_id_tipo_trabajo_foreign` (`id_tipo_trabajo`),
  ADD KEY `tipo_trabajo_items_sugeridos_id_item_foreign` (`id_item`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `usuarios_email_unique` (`email`),
  ADD KEY `usuarios_id_rol_foreign` (`id_rol`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cotizaciones`
--
ALTER TABLE `cotizaciones`
  MODIFY `id_cotizacion` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `detalle_cotizacion`
--
ALTER TABLE `detalle_cotizacion`
  MODIFY `id_detalle` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evidencias`
--
ALTER TABLE `evidencias`
  MODIFY `id_evidencia` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `historial_estados`
--
ALTER TABLE `historial_estados`
  MODIFY `id_historial` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `items_catalogo`
--
ALTER TABLE `items_catalogo`
  MODIFY `id_item` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id_pago` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `perfiles_admin`
--
ALTER TABLE `perfiles_admin`
  MODIFY `id_admin` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `perfiles_clientes`
--
ALTER TABLE `perfiles_clientes`
  MODIFY `id_cliente` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `perfiles_tecnicos`
--
ALTER TABLE `perfiles_tecnicos`
  MODIFY `id_tecnico` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tipos_trabajo`
--
ALTER TABLE `tipos_trabajo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tipo_trabajo_items_sugeridos`
--
ALTER TABLE `tipo_trabajo_items_sugeridos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

-- --------------------------------------------------------

--
-- Structure for view `vw_cotizaciones_resumen`
--
DROP TABLE IF EXISTS `vw_cotizaciones_resumen`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u348616500_sigesto`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_cotizaciones_resumen`  AS SELECT `c`.`id_cotizacion` AS `id_cotizacion`, `c`.`uuid_solicitud` AS `uuid_solicitud`, `c`.`estado` AS `estado`, `c`.`subtotal` AS `subtotal`, `c`.`igv` AS `igv`, `c`.`total` AS `total`, `c`.`created_at` AS `created_at` FROM `cotizaciones` AS `c` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_pagos_resumen`
--
DROP TABLE IF EXISTS `vw_pagos_resumen`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u348616500_sigesto`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_pagos_resumen`  AS SELECT `p`.`id_pago` AS `id_pago`, `p`.`uuid_solicitud` AS `uuid_solicitud`, `p`.`monto_pagado` AS `monto_pagado`, `p`.`metodo_pago` AS `metodo_pago`, `p`.`estado_pago` AS `estado_pago`, `p`.`fecha_pago` AS `fecha_pago` FROM `pagos` AS `p` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_solicitudes_resumen`
--
DROP TABLE IF EXISTS `vw_solicitudes_resumen`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u348616500_sigesto`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_solicitudes_resumen`  AS SELECT `s`.`uuid_solicitud` AS `uuid_solicitud`, `s`.`estado` AS `estado`, `s`.`created_at` AS `created_at`, `c`.`id_cliente` AS `id_cliente`, `ucli`.`nombres` AS `cliente_nombres`, `ucli`.`apellidos` AS `cliente_apellidos`, `t`.`id_tecnico` AS `id_tecnico`, `utec`.`nombres` AS `tecnico_nombres`, `utec`.`apellidos` AS `tecnico_apellidos` FROM ((((`solicitudes` `s` join `perfiles_clientes` `c` on(`c`.`id_cliente` = `s`.`id_cliente`)) join `usuarios` `ucli` on(`ucli`.`id_usuario` = `c`.`id_usuario`)) left join `perfiles_tecnicos` `t` on(`t`.`id_tecnico` = `s`.`id_tecnico`)) left join `usuarios` `utec` on(`utec`.`id_usuario` = `t`.`id_usuario`)) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cotizaciones`
--
ALTER TABLE `cotizaciones`
  ADD CONSTRAINT `cotizaciones_id_usuario_creador_foreign` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `cotizaciones_uuid_solicitud_foreign` FOREIGN KEY (`uuid_solicitud`) REFERENCES `solicitudes` (`uuid_solicitud`) ON DELETE CASCADE;

--
-- Constraints for table `detalle_cotizacion`
--
ALTER TABLE `detalle_cotizacion`
  ADD CONSTRAINT `detalle_cotizacion_id_cotizacion_foreign` FOREIGN KEY (`id_cotizacion`) REFERENCES `cotizaciones` (`id_cotizacion`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_cotizacion_id_item_foreign` FOREIGN KEY (`id_item`) REFERENCES `items_catalogo` (`id_item`);

--
-- Constraints for table `evidencias`
--
ALTER TABLE `evidencias`
  ADD CONSTRAINT `evidencias_uuid_solicitud_foreign` FOREIGN KEY (`uuid_solicitud`) REFERENCES `solicitudes` (`uuid_solicitud`) ON DELETE CASCADE;

--
-- Constraints for table `historial_estados`
--
ALTER TABLE `historial_estados`
  ADD CONSTRAINT `historial_estados_id_usuario_accion_foreign` FOREIGN KEY (`id_usuario_accion`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `historial_estados_uuid_solicitud_foreign` FOREIGN KEY (`uuid_solicitud`) REFERENCES `solicitudes` (`uuid_solicitud`) ON DELETE CASCADE;

--
-- Constraints for table `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_id_usuario_aprobacion_foreign` FOREIGN KEY (`id_usuario_aprobacion`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `pagos_id_usuario_registro_foreign` FOREIGN KEY (`id_usuario_registro`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `pagos_uuid_solicitud_foreign` FOREIGN KEY (`uuid_solicitud`) REFERENCES `solicitudes` (`uuid_solicitud`);

--
-- Constraints for table `perfiles_admin`
--
ALTER TABLE `perfiles_admin`
  ADD CONSTRAINT `perfiles_admin_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Constraints for table `perfiles_clientes`
--
ALTER TABLE `perfiles_clientes`
  ADD CONSTRAINT `perfiles_clientes_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Constraints for table `perfiles_tecnicos`
--
ALTER TABLE `perfiles_tecnicos`
  ADD CONSTRAINT `perfiles_tecnicos_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Constraints for table `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD CONSTRAINT `solicitudes_id_cliente_foreign` FOREIGN KEY (`id_cliente`) REFERENCES `perfiles_clientes` (`id_cliente`),
  ADD CONSTRAINT `solicitudes_id_tecnico_foreign` FOREIGN KEY (`id_tecnico`) REFERENCES `perfiles_tecnicos` (`id_tecnico`);

--
-- Constraints for table `tipo_trabajo_items_sugeridos`
--
ALTER TABLE `tipo_trabajo_items_sugeridos`
  ADD CONSTRAINT `tipo_trabajo_items_sugeridos_id_item_foreign` FOREIGN KEY (`id_item`) REFERENCES `items_catalogo` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `tipo_trabajo_items_sugeridos_id_tipo_trabajo_foreign` FOREIGN KEY (`id_tipo_trabajo`) REFERENCES `tipos_trabajo` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_id_rol_foreign` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
