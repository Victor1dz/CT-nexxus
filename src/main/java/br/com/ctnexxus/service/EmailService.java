package br.com.ctnexxus.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviar(String para, String assunto, String texto) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(para);
        msg.setSubject(assunto);
        msg.setText(texto);
        mailSender.send(msg);
    }
}
