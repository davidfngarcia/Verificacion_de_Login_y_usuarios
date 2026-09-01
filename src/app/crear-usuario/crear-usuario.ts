import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-usuario.html',
})
export class CrearUsuarioComponent {
  username = '';
  password = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.http
      .post(`${environment.apiUrl}/api/usuarios`, {
        username: this.username,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Usuario creado exitosamente';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.activeModal.close('creado');
          }, 1200);
        },
        error: (err) => {
          this.loading = false;

          console.error('❌ Error al crear usuario:', err);

          if (err.status === 409) {
            this.errorMessage = 'Ese nombre de usuario ya existe. Elige otro.';
          } else if (err.status === 400) {
            this.errorMessage = 'Username y password son requeridos.';
          } else {
            this.errorMessage = 'Ocurrió un error al crear el usuario. Intenta de nuevo.';
          }

          this.cdr.detectChanges();
        },
      });
  }

  cancelar(): void {
    this.activeModal.dismiss();
  }
}