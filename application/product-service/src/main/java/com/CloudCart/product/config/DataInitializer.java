
package com.CloudCart.product.config;

import com.CloudCart.product.entity.Product;
import com.CloudCart.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner loadProducts(ProductRepository productRepository) {
        return args -> {

            if (productRepository.count() >= 20) {
 	    	return;
	    }

            productRepository.save(new Product(
                    "Laptop",
                    "14-inch performance laptop",
                    65000,
                    10,
                    "https://picsum.photos/seed/laptop/500/375"
            ));

            productRepository.save(new Product(
                    "Smartphone",
                    "Latest Android smartphone",
                    32000,
                    25,
                    "https://picsum.photos/seed/smartphone/500/375"
            ));

            productRepository.save(new Product(
                    "Wireless Headphones",
                    "Noise cancelling wireless headphones",
                    4500,
                    30,
                    "https://picsum.photos/seed/headphones/500/375"
            ));

            productRepository.save(new Product(
                    "Smart Watch",
                    "Fitness and health tracking smartwatch",
                    7000,
                    20,
                    "https://picsum.photos/seed/smartwatch/500/375"
            ));

            productRepository.save(new Product(
                    "Mechanical Keyboard",
                    "RGB mechanical gaming keyboard",
                    3500,
                    15,
                    "https://picsum.photos/seed/keyboard/500/375"
            ));

            productRepository.save(new Product(
                    "Gaming Mouse",
                    "High precision wireless gaming mouse",
                    2200,
                    18,
                    "https://picsum.photos/seed/mouse/500/375"
            ));

            productRepository.save(new Product(
                    "Monitor",
                    "24-inch Full HD monitor",
                    12000,
                    12,
                    "https://picsum.photos/seed/monitor/500/375"
            ));

            productRepository.save(new Product(
                    "Tablet",
                    "10-inch entertainment tablet",
                    18000,
                    14,
                    "https://picsum.photos/seed/tablet/500/375"
            ));

            productRepository.save(new Product(
                    "Bluetooth Speaker",
                    "Portable wireless Bluetooth speaker",
                    3000,
                    22,
                    "https://picsum.photos/seed/speaker/500/375"
            ));

            productRepository.save(new Product(
                    "Power Bank",
                    "20000mAh fast charging power bank",
                    1800,
                    35,
                    "https://picsum.photos/seed/powerbank/500/375"
            ));

            productRepository.save(new Product(
                    "USB-C Hub",
                    "Multi-port USB-C connectivity hub",
                    2500,
                    16,
                    "https://picsum.photos/seed/usbhub/500/375"
            ));

            productRepository.save(new Product(
                    "Webcam",
                    "1080p Full HD webcam",
                    2800,
                    19,
                    "https://picsum.photos/seed/webcam/500/375"
            ));

            productRepository.save(new Product(
                    "External SSD",
                    "1TB portable external SSD",
                    8500,
                    11,
                    "https://picsum.photos/seed/ssd/500/375"
            ));

            productRepository.save(new Product(
                    "Gaming Controller",
                    "Wireless gaming controller",
                    4200,
                    13,
                    "https://picsum.photos/seed/controller/500/375"
            ));

            productRepository.save(new Product(
                    "Laptop Stand",
                    "Adjustable aluminum laptop stand",
                    1800,
                    24,
                    "https://picsum.photos/seed/laptopstand/500/375"
            ));

            productRepository.save(new Product(
                    "Wireless Charger",
                    "Fast wireless charging pad",
                    1500,
                    28,
                    "https://picsum.photos/seed/charger/500/375"
            ));

            productRepository.save(new Product(
                    "Smart LED Bulb",
                    "Wi-Fi enabled smart LED bulb",
                    900,
                    40,
                    "https://picsum.photos/seed/ledbulb/500/375"
            ));

            productRepository.save(new Product(
                    "Earbuds",
                    "Compact true wireless earbuds",
                    2800,
                    32,
                    "https://picsum.photos/seed/earbuds/500/375"
            ));

            productRepository.save(new Product(
                    "Backpack",
                    "Water-resistant laptop backpack",
                    2500,
                    17,
                    "https://picsum.photos/seed/backpack/500/375"
            ));

            productRepository.save(new Product(
                    "USB-C Cable",
                    "Durable fast charging USB-C cable",
                    500,
                    50,
                    "https://picsum.photos/seed/usbcable/500/375"
            ));
        };
    }
}
