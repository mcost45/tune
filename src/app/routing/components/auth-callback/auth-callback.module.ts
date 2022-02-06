import { NgModule } from '@angular/core';
import { AuthCallbackComponent } from './auth-callback.component';
import { SharedModule } from '../../../shared/shared.module';
import { AuthCallbackRoutingModule } from './auth-callback-routing.module';

@NgModule({
	declarations: [AuthCallbackComponent],
	imports: [SharedModule, AuthCallbackRoutingModule]
})
export class AuthCallbackModule {}
