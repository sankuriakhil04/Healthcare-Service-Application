import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './templates/app-component.html',
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = false;
  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }
}
