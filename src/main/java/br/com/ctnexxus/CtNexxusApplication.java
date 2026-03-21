package br.com.ctnexxus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CtNexxusApplication {

    public static void main(String[] args) {
        SpringApplication.run(CtNexxusApplication.class, args);
        // Reiniciando aplicação para aplicar correções de controllers...
    }
}
